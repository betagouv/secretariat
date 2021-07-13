const { checkUserIsExpired } = require('../controllers/utils');
const config = require('../config')
const BetaGouv = require('../betagouv');
const github = require('../lib/github');

// get users that are member (got a github card) and that have github account that is not in the team
const getGithubUserNotOnOrganization = async () => {
  if (config.stagingUsers) {
    return config.stagingUsers;
  }
  const allGithubOrganizationMembers = await github.getAllOrganizationMembers();
  const users = await BetaGouv.usersInfos();

  const activeGithubUsers = users.filter((x) => {
    const stillActive = !checkUserIsExpired(x);
    return stillActive && x.github;
  });
  const allGithubOrganizationMembersUsername = allGithubOrganizationMembers.map(
    (githubOrganizationMember) => githubOrganizationMember.login,
  );

  const githubUserNotOnOrganization = activeGithubUsers.filter(
    (user) => !allGithubOrganizationMembersUsername.includes(user.github),
  );

  return githubUserNotOnOrganization;
};

const addGithubUserToOrganization = async () => {
  const githubUserNotOnOrganization = await getGithubUserNotOnOrganization();
  try {
    const results = await Promise.all(githubUserNotOnOrganization.map(async (member) => {
      await github.inviteUserByUsernameToOrganization(member.github, config.githubOrganizationName);
      console.log(`Add user ${member.github} to organization`);
    }));
  } catch (err) {
    throw new Error(err);
  }
};

module.exports.addGithubUserToOrganization = addGithubUserToOrganization;
