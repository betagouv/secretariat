import config from "@/config"
import { sendEmail } from "@/config/email.config"
import { EMAIL_TYPES } from "@/modules/email"

const sendTemplateEmail = async () => {
    await sendEmail({
        toEmail: [config.senderEmail],
        type: EMAIL_TYPES.EMAIL_STARTUP_ENTER_INVESTIGATION_PHASE,
        forceTemplate: true,
        variables: {
            startup: 'Ma.startup'
        }
    })
}
sendTemplateEmail().then(() => {
    console.log('Done')
})
