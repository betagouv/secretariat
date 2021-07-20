import { betaGouv } from "../betagouv";

import config from "../config";

import * as utils from "../controllers/utils";
import mattermost from "../lib/mattermost";

// get users that are member (got a github card) and mattermost account that is not in the team
const getUnregisteredMemberActifs = async (activeGithubUsers, allMattermostUsers) => {
  const activeGithubUsersEmails = activeGithubUsers.map((user) => `${user.id}@${config.domain}`);
  const allMattermostUsersEmails = allMattermostUsers.map((mattermostUser) => mattermostUser.email);
  const unregisteredMemberActifs = activeGithubUsersEmails.filter(
    (user) => !allMattermostUsersEmails.includes(user.email),
  );
  return unregisteredMemberActifs;
};

module.exports.inviteUsersToTeamByEmail = async () => {
  const allMattermostUsers = await mattermost.getUserWithParams();
  const users = await betaGouv.usersInfos();
  const activeGithubUsers = users.filter((x) => {
    const stillActive = !utils.checkUserIsExpired(x);
    return stillActive;
  });
  const unregisteredMemberActifs = await getUnregisteredMemberActifs(activeGithubUsers, allMattermostUsers);
  const results = await mattermost.inviteUsersToTeamByEmail(
    unregisteredMemberActifs.map((member) => member.email), config.mattermostTeamId,
  );
  return results;
};
