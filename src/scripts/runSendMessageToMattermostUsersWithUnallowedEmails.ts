import { sendMessageToMattermostUsersWithUnallowedEmails } from "@/schedulers/mattermostScheduler/mattermostScheduler"
import config from '@config'

sendMessageToMattermostUsersWithUnallowedEmails(config.mattermostTeamId).then(() => {
    console.log('Done')
})
