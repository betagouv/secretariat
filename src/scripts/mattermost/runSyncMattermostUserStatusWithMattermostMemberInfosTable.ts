import { syncMattermostUserStatusWithMattermostMemberInfosTable } from "@/schedulers/mattermostScheduler/syncMattermostUserWithMattermostMemberInfosTable"

syncMattermostUserStatusWithMattermostMemberInfosTable().then(() => {
    console.log('Sync syncMattermostUserWithMattermostMemberInfosTable done')
})