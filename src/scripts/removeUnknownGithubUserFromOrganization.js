const { checkUserIsExpired } = require('../controllers/utils');
const config = require('../config');
const BetaGouv = require('../betagouv');
const github = require('../lib/github');

// get users that are member (got a github card) and that have github account that is not in the team
const getUnknownGithubUsersInOrganization = async (org) => {
  const allGithubOrganizationMembers = await github.getAllOrganizationMembers(org);
  const users = await BetaGouv.usersInfos();

  const activeGithubUsers = users.filter((x) => x.github).map((x) => x.github.toLowerCase());
  const allGithubOrganizationMembersUsername = allGithubOrganizationMembers.map(
    (githubOrganizationMember) => githubOrganizationMember.login.toLowerCase(),
  );

  return allGithubOrganizationMembers.filter((user) => {
    const githubUsername = user.login.toLowerCase();
    return !activeGithubUsers.includes(githubUsername);
  });
};

const removeUnknownGithubUserFromOrganization = async () => {
  console.log('Launch remove unknown github users from organization');

  const unknownUsersInOrganization = await getUnknownGithubUsersInOrganization(config.githubOrganizationName);
  console.log('List unknown users');
  console.log(unknownUsersInOrganization);
  if (process.env.featureRemoveUnknownUsers) {
    const results = await Promise.all(unknownUsersInOrganization.map(async (member) => {
      try {
        await github.removeUserByUsernameFromOrganization(member.login, config.githubOrganizationName);
        console.log(`Remove user ${member.github} from organization`);
      } catch (err) {
        console.error(`Cannot remove user ${member.github} from organization ${config.githubOrganizationName}. Error : ${err}`);
      }
    }));
  }
};
removeUnknownGithubUserFromOrganization();
