const knex = require('knex');

module.exports.showPadUser = async function createEmailAddresses(req, res) {
  let users;
  if (!process.env.DATABASE_URL_PAD) {
    res.send('No db found');
  }
  const db = knex({
    client: 'pg',
    connection: process.env.DATABASE_URL_PAD,
  });
  try {
    users = await db('Users').select(['id', 'profileid', 'profile', 'email']).whereNull('email');
    users = users.map((u) => ({
      ...u,
      profile: JSON.parse(u.profile),
    }));
  } catch (e) {
    console.log(e);
  }
  console.log('LCS AFTER 0');
  console.log(users);
  res.send(users);
  // users.forEach(async r => {
  //   if (r.profile.email) {
  //     await knex('Users').update({
  //       email: row[EMAIL_INDEX]
  //     }).where({ profileid: r.profileid })
  //   }
  // })
};

module.exports.updatePadUser = async function createEmailAddresses(req, res) {
  let users;
  if (!process.env.DATABASE_URL_PAD) {
    res.send('No db found');
  }
  const db = knex({
    client: 'pg',
    connection: process.env.DATABASE_URL_PAD,
  });
  try {
    users = await db('Users').select(['id', 'profileid', 'profile', 'email']);
    users = users.map((u) => ({
      ...u,
      profile: JSON.parse(u.profile),
    }));
    users.forEach(async (r) => {
      if (r.profile.email && !r.email) {
        await knex('Users').update({
          email: r.profile.email,
        }).where({ profileid: r.profileid });
      }
    });
  } catch (e) {
    console.log(e);
  }
};
