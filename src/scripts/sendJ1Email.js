const { sendJ1Email } = require('../schedulers/userContractEndingScheduler');

const args = process.argv.slice(2);
if (args[0]) {
  args[0] = JSON.parse(args[0]);
}
sendJ1Email(...args);
