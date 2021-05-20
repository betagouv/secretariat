require('dotenv').config();
const _ = require('lodash/array');
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

const differenceGithubOVH = function differenceGithubOVH(user, ovhAccountName) {
  return user.id === ovhAccountName;
};

module.exports.createEmailAddresses = async function createEmailAddresses() {
  const dbUsers = await knex('users').whereNotNull('secondary_email');

  const githubUsers = await BetaGouv.usersInfos();

  const concernedUsers = githubUsers.reduce((acc, user) => {
    const dbUser = dbUsers.find((x) => x.username === user.id);
    if (dbUser) {
      acc.push({ ...user, ...{ toEmail: dbUser.secondary_email } });
    }
    return acc;
  }, []);

  const allOvhEmails = await BetaGouv.getAllEmailInfos();
  
  // get users that have github acount and no email registered on ovh (yet)
  const unregisteredUsers = _.differenceWith(githubUsers, allOvhEmails, differenceGithubOVH);
  
  console.log(`Email creation : ${unregisteredUsers.length} unregistered user(s) in OVH (${allOvhEmails.length} accounts in OVH. ${githubUsers.length} accounts in Github).`);

  // create email and marrainage
  return Promise.all(
    unregisteredUsers.map((user) => createEmailAndMarrainage(user, 'Secretariat Cron')),
  );
};

module.exports.emailCreationJob = new CronJob(
  '0 */4 * * * *',
  module.exports.createEmailAddresses,
  null,
  true,
  'Europe/Paris',
);
