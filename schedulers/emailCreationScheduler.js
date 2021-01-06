require('dotenv').config();
const { CronJob } = require('cron');
const knex = require('../db');
const BetaGouv = require('../betagouv');
const { createEmail } = require('../controllers/usersController');

module.exports.createEmailAddresses = async function () {
  try {
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
        emailCreationTasks.push(createEmail(concernedUsers[i].id, 'Secretariat Cron', concernedUsers[i].toEmail));
      }
    }

    return Promise.all(emailCreationTasks);
  } catch (err) {
    console.error(err);
    return Promise.resolve();
  }
};

module.exports.emailCreationJob = new CronJob(
  '0 * * * * *', // every minute at second 0
  module.exports.createEmailAddresses,
  null,
  true,
  'Europe/Paris',
);
