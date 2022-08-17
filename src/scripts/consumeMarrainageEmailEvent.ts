import { ConsumeEmailEvent } from "src/modules/marrainage/email.handler";

ConsumeEmailEvent().then(() => {
    console.log('Done')
})