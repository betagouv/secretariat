import config from "@/config"
import { postEventsOnMattermost } from "@schedulers/calendarScheduler"

postEventsOnMattermost({
    numberOfDays:6,
    calendarURL: config.CALENDAR_URL,
    chatWebhook: process.env.CALENDAR_TEMP_WEBHOOK,
    calendarPublicUrl: config.CALENDAR_PUBLIC_URL
}).then(() => {
    console.log('Post events on mattermost done')
})
