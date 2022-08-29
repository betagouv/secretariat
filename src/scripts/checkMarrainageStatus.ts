import { checkMarrainageStatus } from "@/schedulers/marrainageScheduler"

checkMarrainageStatus().then(() => {
    console.log('Done')
})