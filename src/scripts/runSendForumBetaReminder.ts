import { sendForumBetaReminder } from "@/schedulers/calendarScheduler";

sendForumBetaReminder().then((30, 'tmp-lucas-test') => {
    console.log('Send forum beta reminder done')
})

