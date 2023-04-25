import config from "@/config"
import { postEventsOnMattermost } from "@schedulers/calendarScheduler"

postEventsOnMattermost({
    numberOfDays:6,
    canal:'general',
    calendarURL: config.CALENDAR_URL,
    calendarPublicUrl: config.CALENDAR_PUBLIC_URL,
    chatWebhook: config.CHAT_WEBHOOK_URL_GENERAL
}).then(() => {
    console.log('Post events on mattermost done')
})
