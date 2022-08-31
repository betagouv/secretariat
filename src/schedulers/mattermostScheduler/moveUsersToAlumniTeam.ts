import { MattermostUser } from "@/lib/mattermost";
import { Member } from "@/models/member";
import config from '@config';
import * as utils from '@controllers/utils';
import * as mattermost from '@/lib/mattermost';
import betagouv from "@/betagouv";

export async function moveUsersToAlumniTeam(optionalUsers?: Member[], checkAll=false) {
    let users: Member[] = optionalUsers;
    console.log('Start function move users to team alumni');
    if (!users) {
      users = await betagouv.usersInfos();
      users = checkAll ? utils.getExpiredUsers(users, 3) : utils.getExpiredUsersForXDays(users, 3);
    }
  
    const results = await Promise.all(
      users.map(async (user) => {
        try {
          const mattermostUsers: MattermostUser[] = await mattermost.searchUsers({
            term: user.id
          });
          if (!mattermostUsers.length || mattermostUsers.length > 1) {
            console.error(
              `Cannot find mattermost user for ${user.id} : ${mattermostUsers.length} found`
            );
            return;
          }
          const res = await mattermost.addUserToTeam(
            mattermostUsers[0].id,
            config.mattermostAlumniTeamId
          );
          console.log(
            `User ${user.id} with mattermost username ${mattermostUsers[0].username} has been moved to alumni`
          );
          return res;
        } catch (err) {
          throw new Error(
            `Error while moving user ${user.id} to alumni team : ${err}`
          );
        }
      })
    );
    return results;
  }