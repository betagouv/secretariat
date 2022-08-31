import config from '@config';
import * as utils from '@controllers/utils';
import * as mattermost from '@/lib/mattermost';
import betagouv from '@/betagouv';

export async function reactivateUsers() {
    const inactiveMattermostUsers = await mattermost.getInactiveMattermostUsers();
  
    const users = await betagouv.usersInfos();
    const currentUsers = users.filter((x) => !utils.checkUserIsExpired(x));
  
    const currentUsersEmails = currentUsers.map(
      (user) => `${user.id}@${config.domain}`
    );
    const mattermostUsersToReactivate = inactiveMattermostUsers.filter(
      ({ email }) => currentUsersEmails.find((userMail) => userMail === email)
    );
  
    for (const member of mattermostUsersToReactivate) {
      await mattermost.activeUsers(member.id);
    }
    return mattermostUsersToReactivate;
  }