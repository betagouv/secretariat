import { sendEmail } from "@config/email.config"
import { EventEmailMarrainageNewcomer, MarrainageGroup } from "@models/marrainage"
import db from "@/db"
import { EmailProps, EMAIL_TYPES } from "../../email"
import { CommunicationEmailCode, DBUser } from "@/models/dbUser/dbUser"
import betagouv from "@/betagouv"
import { Member } from "@/models/member"

export const onMarrainageSendNewcomerEmail:
    (evenement: EventEmailMarrainageNewcomer) => Promise<void> = async (evt) => {
    
    const group : MarrainageGroup = await db('marrainage_groups').where({
        id: evt.marrainage_group_id
    }).first()
    const dbUser : DBUser = await db('users').where({
        username: evt.user
    }).first()

    const member : Member = await betagouv.userInfosById(evt.user)

    const onboarder : Member = await betagouv.userInfosById(group.onboarder)

    const email : EmailProps = {
        type: EMAIL_TYPES.MARRAINAGE_NEWCOMER_EMAIL,
        toEmail: [dbUser.communication_email === CommunicationEmailCode.SECONDARY && dbUser.secondary_email ? dbUser.secondary_email : dbUser.primary_email],
        variables: {
            member: member,
            onboarder: {
                fullname: onboarder.fullname,
            }
        },
        extraParams: {},
        attachments: [],
    } 
    return sendEmail(email)
  }
