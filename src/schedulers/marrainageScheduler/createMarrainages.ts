import _ from 'lodash/array';

import knex from '@/db';
import { createRequestForUser } from '@controllers/marrainageController';
import { DBUser, EmailStatusCode } from '@models/dbUser';
import betagouv from '@/betagouv';
import { Member } from '@/models/member';
import { getActiveUsers } from '@/controllers/utils';

export async function createMarrainages() {
    console.log('Demarrage du cron job pour créer les marrainages');
    // before this date not every user had marrainage but we don't need to create for them now
    const dateFeatureAdded = new Date('01/23/2022');
    let members : Member[] = await betagouv.usersInfos()
    members = getActiveUsers(members)
    const users : DBUser[] = await knex('users').where({
      primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
    })
    .andWhere('created_at', '>', dateFeatureAdded)
    .whereIn('username', members)
    const marrainages = await knex('marrainage').whereIn('username', users.map(user => user.username))
    const userWithoutMarrainage = _.differenceWith(users, marrainages, (user, marrainage) => user.username === marrainage.username)
    const createMarrainagePromises = await userWithoutMarrainage.map(async(user: DBUser) => {
      try {
        // create marrainage request
        await createRequestForUser(user.username);
      } catch (e) {
        console.error(`Impossible de créer un marrainage pour ${user.username}`)
        // marrainage may fail if no member available
        console.warn(e);
      }
    })
  
    return Promise.all(createMarrainagePromises)
      .then(() => console.log('Cron de création de marrainage terminé'))
      .catch(console.error);
  }
  