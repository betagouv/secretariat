import BetaGouv from '../betagouv';
import * as utils from '@controllers/utils';
import knex from '@/db';
import { DBUser } from '@/models/dbUser/dbUser';
import { Member } from '@models/member';

export async function getActiveSecondaryEmailsForUsers() {
    const users: Member[] = await BetaGouv.usersInfos();
    const activeUsers = users.filter((user) => !utils.checkUserIsExpired(user));
    const dbUsers: DBUser[] = await knex('users')
      .whereNotNull('secondary_email')
      .whereIn(
        'username',
        activeUsers.map((user) => user.id)
      );
    dbUsers.forEach(user => {
      console.log(user.secondary_email)
    })
}

getActiveSecondaryEmailsForUsers()
    