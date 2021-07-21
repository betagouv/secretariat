const { checkUserIsExpired } = require('../controllers/utils');
const config = require('../config');
const BetaGouv = require('../betagouv');
const github = require('../lib/github');

// get users that are member (got a github card) and that have github account that is not in the team
const getGithubUserNotOnOrganization = async (org) => {
  const allGithubOrganizationMembers = await github.getAllOrganizationMembers(org);
  const users = await BetaGouv.usersInfos();

  const activeGithubUsers = users.filter((x) => {
    const stillActive = !checkUserIsExpired(x);
    return stillActive && x.github;
  });
  const allGithubOrganizationMembersUsername = allGithubOrganizationMembers.map(
    (githubOrganizationMember) => githubOrganizationMember.login.toLowerCase(),
  );

  const pendingInvitations = await github.getAllPendingInvitations(config.githubOrganizationName);
  const pendingInvitationsUsernames = pendingInvitations.map((r) => r.login.toLowerCase());
  const githubUserNotOnOrganization = activeGithubUsers.filter(
    (user) => {
      const githubUsername = user.github.toLowerCase();
      return !allGithubOrganizationMembersUsername.includes(githubUsername)
        && !pendingInvitationsUsernames.includes(githubUsername);
    },
  );

  return githubUserNotOnOrganization;
};

const addGithubUserToOrganization = async () => {
  console.log('Launch add github users to organization');

  const githubUserNotOnOrganization = await getGithubUserNotOnOrganization(config.githubOrganizationName);
  const results = await Promise.all(githubUserNotOnOrganization.map(async (member) => {
    try {
      await github.inviteUserByUsernameToOrganization(member.github, config.githubOrganizationName);
      console.log(`Add user ${member.github} to organization`);
    } catch (err) {
      console.error(`Cannot add user ${member.github} to organization ${config.githubOrganizationName}. Error : ${err}`);
    }
  }));
};

module.exports.addGithubUserToOrganization = addGithubUserToOrganization;
