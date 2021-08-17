import { config } from 'dotenv';
import { deleteRedirectionsAfterQuitting } from '../schedulers/userContractEndingScheduler';

config();

deleteRedirectionsAfterQuitting(true).then((r) => console.log(r));
