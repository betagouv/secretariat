import config from "@/config"
import { postEventsOnMattermost } from "@schedulers/calendarScheduler"

postEventsOnMattermost({
    numberOfDays:6,
    calendarURL: config.CALENDAR_GIP_URL,
    chatWebhook: config.CHAT_WEBHOOK_URL_GIP
}).then(() => {
    console.log('Post events on mattermost done')
})