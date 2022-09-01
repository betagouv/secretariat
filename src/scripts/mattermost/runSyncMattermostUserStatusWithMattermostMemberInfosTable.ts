import { syncMattermostUserStatusWithMattermostMemberInfosTable } from "@/schedulers/mattermostScheduler"

syncMattermostUserStatusWithMattermostMemberInfosTable().then(() => {
    console.log('Sync syncMattermostUserWithMattermostMemberInfosTable done')
})