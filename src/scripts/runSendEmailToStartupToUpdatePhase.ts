import { sendEmailToStartupToUpdatePhase } from "@/schedulers/startups/sendEmailToStartupToUpdatePhase"

const runSendEmailToStartupToUpdatePhase = async () => {
    await sendEmailToStartupToUpdatePhase()
}
runSendEmailToStartupToUpdatePhase().then(() => {
    console.log('Done')
})

