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

// get all accounts from OVH to check differences between registered and unregistered accounts
const getUnregisteredOVHUsers = async (concernedUsers) => {
  const allEmailsInfos = await BetaGouv.getAllEmailInfos();
  console.debug('allEmailsInfos', allEmailsInfos);

  if (allEmailsInfos !== null) {
    return concernedUsers.filter((x) => !allEmailsInfos.has(x.id));
  }

  return concernedUsers;
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

  const unregisteredUsers = getUnregisteredOVHUsers(concernedUsers);

  // create email and marrainage
  return Promise.all(
    unregisteredUsers.map((x) => createEmailAndMarrainage(x, 'Secretariat Cron')),
  );
};

module.exports.emailCreationJob = new CronJob(
  '0 * * * * *', // every minute at second 0
  module.exports.createEmailAddresses,
  null,
  true,
  'Europe/Paris',
);
