import { sendEmail } from "../../../config/email.config"
import { MarrainageGroupMember, MarrainageOnboarderEmailEvent } from "../../../models/marrainage"
import db from "../../../db"
import { EMAIL_TYPES, MarrainageOnboarderEmail } from "../../email"
import { CommunicationEmailCode, DBUser } from "../../../models/dbUser"
import { Member } from "../../../models/member"
import betagouv from "../../../betagouv"

export const onMarrainageSendOnboarderEmail:
    (evenement: MarrainageOnboarderEmailEvent) => Promise<void> = async (evt) => {
    
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


    const email : MarrainageOnboarderEmail = {
        type: EMAIL_TYPES.MARRAINAGE_ONBOARDER_EMAIL,
        subject: 'Nouvelle email de parrainage pour parrain/marraine',
        toEmail: [onboarder.communication_email === CommunicationEmailCode.PRIMARY ? onboarder.primary_email : onboarder.secondary_email],
        variables: {
            member: onboarderBetaInfo,
            newcomers: newcomers.map(newcomer => ({
                fullname: newcomer.username,
                email: newcomer.communication_email ? newcomer.primary_email : newcomer.secondary_email
            }))
        },
        extraParams: {},
        attachments: [],
    } 
    return sendEmail(email)
  }
