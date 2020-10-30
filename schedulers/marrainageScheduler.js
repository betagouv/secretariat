require('dotenv').config();
const { CronJob } = require('cron');
const knex = require('../db');
const { reloadMarrainage } = require('../controllers/marrainageController');

const reloadMarrainages = async function () {
  console.log('Demarrage du cron job pour la relance de marrainages');
  const cutoffDate = new Date(new Date().setDate(new Date().getDate() - 2)); // two days ago
  const marrainageDetailsResponse = await knex('marrainage').select()
      .where({ completed: false })
      .where('last_updated', '<', cutoffDate);

  const reloadItems = [];
  for (let i = 0; i < marrainageDetailsResponse.length; i += 1) {
    try {
      reloadItems.push(reloadMarrainage(marrainageDetailsResponse[i].username));
    } catch (err) {
      console.error(err);
    }
  }
  return Promise.all(reloadItems);
};

module.exports.reloadMarrainageJob = new CronJob(
  '0 0 10 * * *', // every day at 10:00:00
  reloadMarrainages,
  null,
  true,
  'Europe/Paris',
);
