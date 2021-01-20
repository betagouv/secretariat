require('dotenv').config();
const { CronJob } = require('cron');
const config = require('../config');
const knex = require('../db');
const BetaGouv = require('../betagouv');
const utils = require('../controllers/utils');
const { createEmail } = require('../controllers/usersController');
const { createRequestForUser } = require('../controllers/marrainageController');

const createEmailAndMarrainage = async (user, creator) => {
  await createEmail(user.id, creator, user.toEmail);
  // once email is created we generate marrainage request
  const dateInTwoMonth = new Date();
  dateInTwoMonth.setMonth(dateInTwoMonth.getMonth() + 2);
  const userStartDate = new Date(user.start);
  if (userStartDate < dateInTwoMonth) {
    try {
      // create marrainage request
      await createRequestForUser(user.id);
    } catch (e) {
      // marrainage may fail if no member available
      console.warn(e);
    }
  }
};

module.exports.createEmailAddresses = async function createEmailAddresses() {
  console.log('Demarrage du cron job pour la création des adresses email');

  const dbUsers = await knex('users').whereNotNull('secondary_email');
  const githubUsers = await BetaGouv.usersInfos();

  const concernedUsers = githubUsers.reduce((acc, user) => {
    const dbUser = dbUsers.find((x) => x.username === user.id);
    if (dbUser) {
      acc.push({ ...user, ...{ toEmail: dbUser.secondary_email } });
    }
    return acc;
  }, []);

  const emailCreationTasks = [];

  /* https://eslint.org/docs/rules/no-await-in-loop#when-not-to-use-it */
  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < concernedUsers.length; i += 1) {
    const emailInfos = await BetaGouv.emailInfos(concernedUsers[i].id);
    if (!emailInfos || !emailInfos.email) {
      emailCreationTasks.push(
        createEmailAndMarrainage(concernedUsers[i], 'Secretariat Cron'),
      );
    }
  }

  return Promise.all(emailCreationTasks);
};

module.exports.emailCreationJob = new CronJob(
  '0 * * * * *', // every minute at second 0
  module.exports.createEmailAddresses,
  null,
  true,
  'Europe/Paris',
);
