import { sendForumBetaReminder } from "@/schedulers/calendarScheduler";

sendForumBetaReminder(0, 'tmp-lucas-test').then(() => {
    console.log('Send forum beta reminder done')
})

