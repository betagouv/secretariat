import { syncMattermostUserWithMattermostMemberInfosTable } from "@/schedulers/mattermostScheduler/syncMattermostUserWithMattermostMemberInfosTable"

syncMattermostUserWithMattermostMemberInfosTable().then(() => {
    console.log('Sync syncMattermostUserWithMattermostMemberInfosTable done')
})