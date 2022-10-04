import config from "@/config"
import { deactivateMattermostUsersWithUnallowedEmails } from "@/schedulers/mattermostScheduler/mattermostScheduler"

deactivateMattermostUsersWithUnallowedEmails(config.mattermostTeamId).then(() => {
    console.log('Done')
})
