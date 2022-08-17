import { ConsumeEmailEvent } from "../modules/marrainage/email.handler";

ConsumeEmailEvent().then(() => {
    console.log('Done')
})