import { sendForumBetaReminder } from "@/schedulers/calendarScheduler";

sendForumBetaReminder(30, 'tmp-lucas-test').then(() => {
    console.log('Send forum beta reminder done')
})

