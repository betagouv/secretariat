import { MattermostUser } from "@/lib/mattermost";
import { DBUser } from "@/models/dbUser/dbUser";
import { Member } from "@/models/member";
import knex from "@/db";
import config from '@config';
import * as utils from '@controllers/utils';
import * as mattermost from '@/lib/mattermost';
import betagouv from "@/betagouv";

export async function removeUsersFromCommunityTeam(optionalUsers?: Member[], checkAll=true) {
    let users: Member[] = optionalUsers;
    console.log('Start function remove users from community team');
    if (!users) {
      users = await betagouv.usersInfos();
      users = checkAll ? utils.getExpiredUsers(users, 3) : utils.getExpiredUsersForXDays(users, 3);
    }
    const dbUsers : DBUser[] = await knex('users').whereNotNull('secondary_email');
    const concernedUsers = users.map((user) => {
      const dbUser = dbUsers.find((x) => x.username === user.id);
      if (dbUser) {
        return { ...user, ...{ toEmail: dbUser.secondary_email }};
      }
      return user;
    });
    const results = await Promise.all(
      concernedUsers.map(async (user) => {
        try {
          const mattermostUsers: MattermostUser[] = await mattermost.searchUsers({
            term: user.id,
            team_id: config.mattermostTeamId,
          });
          if (!mattermostUsers.length || mattermostUsers.length > 1) {
            console.error(
              `Cannot find mattermost user for ${user.id} : ${mattermostUsers.length} found`
            );
            return;
          }
          const res = await mattermost.removeUserFromTeam(
            mattermostUsers[0].id,
            config.mattermostTeamId
          );
          console.log(
            `User ${user.id} with mattermost username ${mattermostUsers[0].username} has been removed from community`
          );
          return res;
        } catch (err) {
          throw new Error(
            `Error while removing user ${user.id} from community team : ${err}`
          );
        }
      })
    );
    return results;
  }