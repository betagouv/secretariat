const { CronJob } = require('cron');
const knex = require('../db');
const { reloadMarrainage } = require('../controllers/marrainageController');

const reloadMarrainages = async function () {
  console.log('Demarrage du cron job pour la relance de marrainages');
  const cutoffDate = new Date(new Date().setDate(new Date().getDate() - 2)); // two days ago
  const marrainageDetailsResponse = await knex('marrainage').select()
      .where({ completed: false })
      .where('last_updated', '<', cutoffDate);
  for (let i = 0; i < marrainageDetailsResponse.length; i += 1) {
    try {
      reloadMarrainage(marrainageDetailsResponse[i].username);
    } catch (err) {
      console.error(err);
    }
  }
};

module.exports.reloadMarrainageJob = new CronJob(
  '* 0 10 */2 * *', // every two days
  reloadMarrainages,
  null,
  false,
  'Europe/Paris',
);
