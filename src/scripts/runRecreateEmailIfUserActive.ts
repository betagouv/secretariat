import { recreateEmailIfUserActive } from "@/schedulers/recreateEmailIfUserActive";

recreateEmailIfUserActive().then(() => {
    console.log('Done')
})
