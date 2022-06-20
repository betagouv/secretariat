import { postEventsOnMattermost } from "../schedulers/calendarScheduler"

postEventsOnMattermost().then(() => {
    console.log('Post events on mattermost done')
})