const { sendJ1Email } = require('../schedulers/userContractEndingScheduler');

const args = process.argv.slice(2);
if (args[1]) {
  args[1] = JSON.parse(args[1]);
}
sendJ1Email(...args);
