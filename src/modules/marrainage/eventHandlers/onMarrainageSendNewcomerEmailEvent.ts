import { sendEmail } from "@config/email.config"
import { EventEmailMarrainageNewcomer } from "@models/marrainage"
import db from "../../../db"
import { EmailProps, EMAIL_TYPES } from "../../email"
import { CommunicationEmailCode, DBUser } from "@models/dbUser"

export const onMarrainageSendNewcomerEmail:
    (evenement: EventEmailMarrainageNewcomer) => Promise<void> = async (evt) => {
    
    const member : DBUser = await db('users').where({
        username: evt.user
    }).first()

    const email : EmailProps = {
        type: EMAIL_TYPES.MARRAINAGE_NEWCOMER_EMAIL,
        toEmail: [member.communication_email === CommunicationEmailCode.PRIMARY ? member.primary_email : member.secondary_email],
        variables: {
            member: member
        },
        extraParams: {},
        attachments: [],
    } 
    return sendEmail(email)
  }
