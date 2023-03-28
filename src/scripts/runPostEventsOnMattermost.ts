import config from "@/config"
import { postEventsOnMattermost } from "@schedulers/calendarScheduler"

postEventsOnMattermost({
    numberOfDays:6,
    calendarURL: config.CALENDAR_GIP_URL,
    chatWebhook: config.CHAT_WEBHOOK_URL_GIP,
    calendarPublicUrl: config.CALENDAR_GIP_PUBLIC_URL
}).then(() => {
    console.log('Post events on mattermost done')
})