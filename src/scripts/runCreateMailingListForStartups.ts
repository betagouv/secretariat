import { createMailingListForStartups } from "@/schedulers/startups/createMailingListForStartups"

createMailingListForStartups().then(() => {
    console.log('Create mailing lists done.')
})

