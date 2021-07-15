import { onUserContractEnding } from '../schedulers/userContractEndingScheduler';

const args = process.argv.slice(2);
onUserContractEnding(...args);
