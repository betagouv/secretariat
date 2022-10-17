import { sendEmail } from "@config/email.config"
import { MarrainageGroupMember, EventEmailMarrainageOnboarder } from "@models/marrainage"
import db from "@/db"
import { EmailProps, EMAIL_TYPES } from "../../email"
import { CommunicationEmailCode, DBUser } from "@/models/dbUser/dbUser"
import { Member } from "@models/member"
import betagouv from "@/betagouv"

export const onMarrainageSendOnboarderEmail:
    (evenement: EventEmailMarrainageOnboarder) => Promise<void> = async (evt) => {
    
    const onboarder : DBUser = await db('users')
        .where({
            username: evt.user
        }).first()

    if (!onboarder) {
        console.error(`Error : user ${evt.user} does not exist in db cannot send email`)
        return
    }

    const onboarderBetaInfo : Member = await betagouv.userInfosById(evt.user)
    
    const newcomers : (DBUser & MarrainageGroupMember)[] = await db('marrainage_groups_members')
        .where({
            marrainage_group_id : evt.marrainage_group_id
        })
        .join('users', 'users.username', 'marrainage_groups_members.username' )
        .select('users.*')


    const email : EmailProps = {
        type: EMAIL_TYPES.MARRAINAGE_ONBOARDER_EMAIL,
        toEmail: [onboarder.communication_email === CommunicationEmailCode.SECONDARY && onboarder.secondary_email ? onboarder.secondary_email : onboarder.primary_email],
        variables: {
            member: onboarderBetaInfo,
            newcomers: newcomers.map(newcomer => ({
                fullname: newcomer.username,
                email: newcomer.communication_email ? newcomer.primary_email : newcomer.secondary_email,
                secondary_email: newcomer.secondary_email
            }))
        },
        extraParams: {},
        attachments: [],
    } 
    return sendEmail(email)
  }
