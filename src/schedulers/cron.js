require('./marrainageScheduler');
require('./emailCreationScheduler');
require('./newsletterScheduler');

// const { CronJob } = require('cron');
// const { onUserContractEnding } = require('./userContractEndingScheduler');

// const onUserContractEndIn15days = new CronJob(
//   '0 */8 * * * *',
//   () => onUserContractEnding('mail15days'),
//   null,
//   true,
//   'Europe/Paris',
// );

// const onUserContractEndIn2days = new CronJob(
//   '0 */8 * * * *',
//   () => onUserContractEnding('mail2days'),
//   null,
//   true,
//   'Europe/Paris',
// );
