import { config } from 'dotenv';
import { deleteRedirectionsAfterQuitting } from '../schedulers/userContractEndingScheduler';

config();

deleteRedirectionsAfterQuitting(false).then((r) => console.log(r));
