import { sendEmail } from "../../../config/email.config"
import { MarrainageOnboarderEmailEvent } from "src/models/marrainage"
import db from "../../../db"
import { EMAIL_TYPES, MarrainageOnboarderEmail } from "../../email"
import { CommunicationEmailCode, DBUser } from "src/models/dbUser"

export const onMarrainageSendOnboarderEmail:
    (evenement: MarrainageOnboarderEmailEvent) => Promise<void> = async (evt) => {
    
    const member : DBUser = await db('users').where({
        username: evt.user
    }).first()

    const email : MarrainageOnboarderEmail = {
        type: EMAIL_TYPES.MARRAINAGE_ONBOARDER_EMAIL,
        subject: 'Nouvelle email de parrainage pour parrain/marraine',
        toEmail: [member.communication_email === CommunicationEmailCode.PRIMARY ? member.primary_email : member.secondary_email],
        variables: {
            member: member
        },
        extraParams: {},
        attachments: [],
        recipients: []
    } 
    return sendEmail(email)
  }
