import _ from 'lodash/array';

import knex from '../db';
import { reloadMarrainage } from '../controllers/marrainageController';
import { createRequestForUser } from '../controllers/marrainageController';
import { DBUser, EmailStatusCode } from '../models/dbUser';
import { MarrainageGroup, MarrainageGroupStatus } from '../models/marrainage';
import config from '../config';
import Redis from '../infra/redis';

export async function reloadMarrainages() {
  console.log('Demarrage du cron job pour la relance de marrainages');
  const cutoffDate = new Date(new Date().setDate(new Date().getDate() - 2)); // two days ago
  cutoffDate.setHours(23, 59, 59, 59); // end of day
  const marrainageDetailsResponse = await knex('marrainage')
    .select()
    .where({ completed: false })
    .where('last_updated', '<=', cutoffDate);

  const reloadItems = [];
  for (let i = 0; i < marrainageDetailsResponse.length; i += 1) {
    reloadItems.push(
      reloadMarrainage(marrainageDetailsResponse[i].username)
        .then(() => {
          console.log(
            `Cron de marrainage a relancé ${marrainageDetailsResponse[i].username}`
          );
        })
        .catch((error) => {
          console.error(
            `Cron de marrainage n'a pas pu relancer ${marrainageDetailsResponse[i].username} : ${error.message}`
          );
        })
    );
  }
  return Promise.all(reloadItems)
    .then(() => console.log('Cron de marrainage terminé'))
    .catch(console.error);
}

export async function createMarrainages() {
  console.log('Demarrage du cron job pour créer les marrainages');
  // before this date not every user had marrainage but we don't need to create for them now
  const dateFeatureAdded = new Date('01/23/2022');
  const users : DBUser[] = await knex('users').where({
    primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
  }).andWhere('created_at', '>', dateFeatureAdded)
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

export async function checkMarrainageStatus() {

    const marrainage_groups : MarrainageGroup[] = await knex('marrainage_groups')
    .where({
      status: MarrainageGroupStatus.PENDING,
    })
    .where('count', '>=', config.MARRAINAGE_GROUP_LIMIT)
    for(const marrainage_group of marrainage_groups) {
      await knex('marrainage_groups')
        .where({
          id: marrainage_group.id
      })
      .update({
        status: MarrainageGroupStatus.DOING
      })
      Redis.produce('MarrainageIsDoingEvent', { marrainage_group_id: marrainage_group.id })
    }
}

export async function sendEmailOnMarrainageCreated() {
  const messageHandler = (msg, cb) => {
    const payload = JSON.parse(msg)
    console.log('Message payload', payload);
    cb(); // acknowledging the message
  };
  Redis.consume('MarrainageIsDoingEvent', messageHandler)
}
