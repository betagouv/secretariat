import { sendEmailOnMarrainageCreated } from "../schedulers/marrainageScheduler";

sendEmailOnMarrainageCreated().then(() => {
    console.log('Done')
})