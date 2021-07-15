require('./marrainageScheduler');
require('./emailCreationScheduler');
require('./newsletterScheduler');

// const { CronJob } = require('cron');
// const { sendContractEndingMessageToUsers } = require('./userContractEndingScheduler');

// const onUserContractEndIn15days = new CronJob(
//   '0 */8 * * * *',
//   () => sendContractEndingMessageToUsers('mail15days'),
//   null,
//   true,
//   'Europe/Paris',
// );

// const onUserContractEndIn2days = new CronJob(
//   '0 */8 * * * *',
//   () => sendContractEndingMessageToUsers('mail2days'),
//   null,
//   true,
//   'Europe/Paris',
// );
