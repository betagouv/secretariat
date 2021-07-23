require('dotenv').config();
const _ = require('lodash/array');
const { CronJob } = require('cron');
const config = require('../config');
const knex = require('../db');
const BetaGouv = require('../betagouv');
const utils = require('../controllers/utils');
const { createEmail } = require('../controllers/usersController');
const { createRequestForUser } = require('../controllers/marrainageController');
const betagouv = require('../betagouv');

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

// get users that have github acount and no email registered on ovh (yet)
const getUnregisteredOVHUsers = async (githubUsers) => {
  const allOvhEmails = await BetaGouv.getAllEmailInfos();
  console.log(`${allOvhEmails.length} accounts in OVH. ${githubUsers.length} accounts in Github.`);

  return _.differenceWith(githubUsers, allOvhEmails, differenceGithubOVH);
};

const getValidUsers = async () => {
  const githubUsers = await BetaGouv.usersInfos();
  return githubUsers.filter((x) => !utils.checkUserIsExpired(x));
};

module.exports.createEmailAddresses = async function createEmailAddresses() {
  console.log('Demarrage du cron job pour la création des adresses email');

  const dbUsers = await knex('users').whereNotNull('secondary_email');

  const githubUsers = await getValidUsers();

  const concernedUsers = githubUsers.reduce((acc, user) => {
    const dbUser = dbUsers.find((x) => x.username === user.id);
    if (dbUser) {
      acc.push({ ...user, ...{ toEmail: dbUser.secondary_email } });
    }
    return acc;
  }, []);

  const unregisteredUsers = await getUnregisteredOVHUsers(concernedUsers);
  console.log(`${unregisteredUsers.length} unregistered user(s) in OVH.`);

  // create email and marrainage
  return Promise.all(
    unregisteredUsers.map((user) => createEmailAndMarrainage(user, 'Secretariat Cron')),
  );
};

const getOneDayExpiredUsers = (users) => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const formatedDate = utils.formatDateYearMonthDay(date);
  const oneDayExpiredUsers = users.filter((x) => x.end === formatedDate);
  return oneDayExpiredUsers;
};

module.exports.reinitPasswordEmail = async () => {
  const users = await BetaGouv.usersInfos();
  const expiredUsers = getOneDayExpiredUsers(users);

  return Promise.all(
    expiredUsers.map(async (user) => {
      const newPassword = utils.getRandomPassword(24, 16);
      try {
        await BetaGouv.changePassword(user.id, newPassword);
        console.log(`Le mot de passe de ${user.fullname} a été modifié car son contrat finissait le ${user.end}.`);
      } catch (err) {
        console.log(`Le mode de passe de ${user.fullname} n'a pas pu être modifié: ${err}`);
      }
    }),
  );
};

module.exports.emailCreationJob = new CronJob(
  '0 */4 * * * *',
  module.exports.createEmailAddresses,
  null,
  true,
  'Europe/Paris',
);
