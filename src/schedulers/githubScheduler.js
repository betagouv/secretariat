const { checkUserIsExpired } = require('../controllers/utils');
const BetaGouv = require('../betagouv');
const github = require('../lib/github');

// get users that are member (got a github card) and that have github account that is not in the team
const getGithubUserNotOnBetagouvOrganization = async () => {
  const allGithubOrganizationMembers = await github.getAllOrganizationMembers();
  const users = await BetaGouv.usersInfos();

  const activeGithubUsers = users.filter((x) => {
    const stillActive = !checkUserIsExpired(x);
    return stillActive && x.github;
  });
  const allGithubOrganizationMembersUsername = allGithubOrganizationMembers.map(
    (githubOrganizationMember) => githubOrganizationMember.login,
  );

  const githubUserNotOnBetagouvOrganization = activeGithubUsers.filter(
    (user) => !allGithubOrganizationMembersUsername.includes(user.github),
  );

  return githubUserNotOnBetagouvOrganization;
};

const addGithubUserToOrganization = async () => {
  const githubUserNotOnBetagouvOrganization = await getGithubUserNotOnBetagouvOrganization();
  try {
    const results = await Promise.all(githubUserNotOnBetagouvOrganization.map(async (member) => {
      await github.inviteUserByUsername(member.github);
      console.log(`Add user ${member.github} to organization`);
    }));
  } catch (err) {
    throw new Error(err);
  }
};

module.exports.addGithubUserToOrganization = addGithubUserToOrganization;
