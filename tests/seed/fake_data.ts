import { v4 as uuidv4 } from 'uuid';
import ovh0 from 'ovh';

export async function seed(knex) {
  // A few universities
  const newsletterList = [
    {
      id: uuidv4(),
      year_week: "2021-10",
      url: "https://pad.incubateur.net/infolettre-2021-10-d38417a9",
      created_at: "2021-04-04 00:00:00+00"
    },
    {
      id: uuidv4(),
      year_week: "2021-05",
      url: "https://pad.incubateur.net/bIl_kERiTAmK6i19N-96RA",
      sent_at: "2021-02-04 00:00:00+00",
      created_at: "2021-02-04 00:00:00+00"
    },
    {
      id: uuidv4(),
      year_week: "2021-06",
      url: "https://pad.incubateur.net/w61b5DNLScmt7EoZF3FFdQ",
      sent_at: "2021-02-11 00:00:00+00",
      validator: "julien.dauphant",
      created_at: "2021-02-11 00:00:00+00"
    },
    {
      id: uuidv4(),
      year_week: "2021-07",
      url: "https://pad.incubateur.net/3xOZWdxSTOGKmN6SYCnMPA",
      sent_at: "2021-02-18 00:00:00+00",
      created_at: "2021-02-18 00:00:00+00",
      validator: "julien.dauphant"
    },
    {
      id: uuidv4(),
      year_week: "2021-08",
      url: "https://pad.incubateur.net/3b287fH_SUWreI2gBJR58w",
      sent_at: "2021-02-25 00:00:00+00",
      created_at: "2021-02-25 00:00:00+00",
      validator: "julien.dauphant"
    }
  ];

  await knex("newsletters").insert(newsletterList);

  console.log(`inserted ${newsletterList.length} fake data to newsletters table`);

  await populatePrimaryEmail(knex)
  console.log('Populate users table with existing emails')
};

const populatePrimaryEmail = async(knex) => {
  const ovh = ovh0({
    appKey: process.env.OVH_APP_KEY,
    appSecret: process.env.OVH_APP_SECRET,
    consumerKey: process.env.OVH_CONSUMER_KEY,
  });
  
  const url = `/email/domain/${process.env.domain}/account/`;
  const allOvhEmails = await ovh.requestPromised('GET', url, {});
  for (const emailId of allOvhEmails) {
      await knex('users').insert({
          username: emailId,
          primary_email: `${emailId}@${process.env.domain}`
      })
  }
}