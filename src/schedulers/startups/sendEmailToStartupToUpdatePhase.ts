import { sendEmail } from "@/config/email.config"
import db from "@/db"
import { ACTIVE_PHASES, DBStartup, PHASE_READABLE_NAME } from "@/models/startup"
import { EMAIL_TYPES } from "@/modules/email"

export const sendEmailToStartupToUpdatePhase = async (startupsArg?: DBStartup[]) => {
    const startups : DBStartup[] = startupsArg || await db('startups')
        .whereIn('current_phase', ACTIVE_PHASES)
        .whereNotNull('mailing_list')
    console.log(`Will send email to ${startups.length} mailing lists`)

    for (const startup of startups) {
        const phase = startup.current_phase
        try {
            await sendEmail({
                type: EMAIL_TYPES.EMAIL_STARTUP_ASK_PHASE,
                variables: {
                    phase,
                    readablePhase: PHASE_READABLE_NAME[phase],
                    startup: startup.name,
                    link: `https://espace-membre.incubateur.net/startups/${startup.id}/info-form`
                },
                forceTemplate: true,
                toEmail: [startup.mailing_list]
            })
        } catch (e) {
            console.error(e)
        }
    }
}

