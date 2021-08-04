import knex from '../db';
import { reloadMarrainage } from '../controllers/marrainageController';

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
            `Cron de marranaige a relancé ${marrainageDetailsResponse[i].username}`
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
    .then(() => console.log('Cron de marranaige terminé'))
    .catch(console.error);
}
