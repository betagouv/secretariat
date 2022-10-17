import sinon from "sinon";

import { onMarrainageSendNewcomerEmail } from "./onMarrainageSendNewcomerEmailEvent";
import { EventEmailMarrainageNewcomer, MARRAINAGE_EVENT } from "@models/marrainage/marrainageEvent";
import * as Email from '@config/email.config'
import db from "../../../db";
import { CommunicationEmailCode, DBUser } from "@/models/dbUser/dbUser";
import { EmailProps, EMAIL_TYPES } from "@modules/email";
import betagouv from "@/betagouv";
import { Member } from "@/models/member";

describe('Test marrainage send newcomer email', () => {
    it('should send email to newcomer email', async () => {
        const newcomer = 'membre.nouveau'
        const [dbUser] : DBUser[] = await db('users').where({ username: newcomer })
        const user : Member = await betagouv.userInfosById(newcomer)
        const [marrainage_group] = await db('marrainage_groups').insert({ 
            onboarder: 'membre.actif'
        }).returning('*')
        const evt : EventEmailMarrainageNewcomer = {
            type: MARRAINAGE_EVENT.MARRAINAGE_SEND_NEWCOMER_EMAIL,
            user: dbUser.username,
            marrainage_group_id: marrainage_group.id
        }
        
        await onMarrainageSendNewcomerEmail(evt)
        const sendEmail = sinon.spy(Email, 'sendEmail');
        const email : EmailProps = {
            type: EMAIL_TYPES.MARRAINAGE_NEWCOMER_EMAIL,
            variables: {
                member: {
                    ...user
                },
                onboarder: {
                    fullname: "Jean Paul"
                }
            },
            extraParams: {},
            attachments: [],
            toEmail: [dbUser.communication_email === CommunicationEmailCode.SECONDARY && dbUser.secondary_email ? dbUser.secondary_email : dbUser.primary_email],
        }
        sendEmail.calledOnceWith(email)
        sendEmail.restore()
    })
})
