require('dotenv').config();
const knex = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL_PAD,
});

module.exports.showPadUser = async function createEmailAddresses(req, res) {
  let users;
  try {
    users = await knex('Users').select('id profileid profile');
  } catch (e) {
    console.log(e);
  }
  console.log('LCS AFTER 0');
  console.log(users);
  res.send('Success', () => {
    res.send();
  });
  // users.forEach(async r => {
  //   if (r.profile.email) {
  //     await knex('Users').update({
  //       email: row[EMAIL_INDEX]
  //     }).where({ profileid: r.profileid })
  //   }
  // })
};
