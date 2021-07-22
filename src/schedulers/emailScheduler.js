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

const getOneDayExpiredUsers = async () => {
    // const users = await BetaGouv.usersInfos();

    const date = new Date();
    date.setDate(date.getDate() - 1);
    const formatedDate = utils.formatDateYearMonthDay(date);
    console.log('formated date ', formatedDate)
  
    const users =  [
      {
        id: 'charlotte.poursuibes',
        fullname: 'Charlotte Poursuibes',
        role: 'Chargée de déploiement',
        start: '2020-09-01',
        end: '2021-01-30',
        employer: 'admin/'
      }, {
        id: 'cherif.manfredini',
        fullname: 'Cherif Manfredini',
        role: 'Intrapreneur',
        start: '2018-01-01',
        end: '2021-07-21',
        employer: 'admin/Département du Var'
      },
    ];
  
    const oneDayExpiredUsers = users.filter((x) => {
      return x.end === formatedDate; 
    });
    return oneDayExpiredUsers;
}

const getRandomPassword = (maxLength, minLength) => {
  const passwordChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#@!%&()/";
  const randPasswordLength = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
  return Array(randPasswordLength).fill(passwordChars).map(function(x) { 
    return x[Math.floor(Math.random() * x.length)] 
  }).join('');
}

module.exports.reinitPasswordEmail = async () => {
  const expiredUsers = await getOneDayExpiredUsers();
  expiredUsers.forEach(user => {
    const newPassword = getRandomPassword(24, 16);
    await betagouv.changePassword(user.id, newPassword);
    console.log(`Le mot de passe de ${user.fullname} a été modifié car son contrat finissait le ${user.end}.`)
  });
}; 

// module.exports.emailCreationJob = new CronJob(
//   '0 */4 * * * *',
//   module.exports.createEmailAddresses,
//   null,
//   true,
//   'Europe/Paris',
// );
