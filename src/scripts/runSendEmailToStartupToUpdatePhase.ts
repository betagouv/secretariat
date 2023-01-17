import { StartupPhase } from "@/models/startup"
import { sendEmailToStartupToUpdatePhase } from "@/schedulers/startups/sendEmailToStartupToUpdatePhase"

const runSendEmailToStartupToUpdatePhase = async () => {
    await sendEmailToStartupToUpdatePhase([{
        mailing_list: 'espace-membre@incubateur.net',
        id: 'espace-membre',
        name: 'espace-membre',
        pitch: 'espace-membre',
        stats_url: 'espace-membre',
        link: '',
        repository: 'espace-membre',
        contact: 'espace-membre',
        phases: [],
        current_phase: StartupPhase.PHASE_ACCELERATION,
        incubator: '',
    }])
}
runSendEmailToStartupToUpdatePhase().then(() => {
    console.log('Done')
})

