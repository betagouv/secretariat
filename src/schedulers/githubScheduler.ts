import { checkUserIsExpired } from "../controllers/utils";
import config from "../config";
import { betaGouv } from "../betagouv";
import * as github from "../lib/github";

// get users that are member (got a github card) and that have github account that is not in the team
const getGithubUserNotOnOrganization = async (org) => {
  const allGithubOrganizationMembers = await github.getAllOrganizationMembers(org);
  const users = await betaGouv.usersInfos();

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

export const addGithubUserToOrganization = async () => {
  console.log('Launch add github users to organization');
  const githubUserNotOnOrganization = await getGithubUserNotOnOrganization(config.githubOrganizationName);
  await Promise.all(githubUserNotOnOrganization.map(async (member) => {
    try {
      await github.inviteUserByUsernameToOrganization(member.github, config.githubOrganizationName);
    } catch (err) {
      console.error(`Cannot add user ${member.github} to organization ${config.githubOrganizationName}. Error : ${err}`);
    }
  }));
};
