import { sendContractEndingMessageToUsers } from '../schedulers/userContractEndingScheduler';

const args = process.argv.slice(2);
if (args[1]) {
  args[1] = JSON.parse(args[1]);
}

// @ts-ignore
sendContractEndingMessageToUsers(...args);
