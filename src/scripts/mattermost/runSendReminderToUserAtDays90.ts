import { sendReminderToUserAtDays } from "@/schedulers/mattermostScheduler/removeBetaAndParnersUsersFromCommunityTeam";

sendReminderToUserAtDays({ nbDays: 90 }).then(() => {
    console.log('Reminder has run')
})
