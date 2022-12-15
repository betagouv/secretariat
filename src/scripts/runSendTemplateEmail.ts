import config from "@/config"
import { sendEmail } from "@/config/email.config"
import { EMAIL_TYPES } from "@/modules/email"

function sendTemplateEmail() {
    sendEmail({
        toEmail: [config.senderEmail],
        type: EMAIL_TYPES.EMAIL_STARTUP_ENTER_INVESTIGATION_PHASE,
        variables: {
            startup: 'Ma.startup'
        }
    })
}
sendTemplateEmail()
