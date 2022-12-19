import config from "@/config"
import { sendEmail } from "@/config/email.config"
import { EMAIL_TYPES } from "@/modules/email"

const sendTemplateEmail = async () => {
    await sendEmail({
        toEmail: [config.senderEmail],
        type: EMAIL_TYPES.EMAIL_NEW_MEMBER_PR,
        forceTemplate: true,
        variables: {
            startup: 'Ma.startup',
            isEmailBetaAsked: false,
            name: "Jean",
            prUrl: 'http://beta.gouv.fr'
        }
    })
}
sendTemplateEmail().then(() => {
    console.log('Done')
})
