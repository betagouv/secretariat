import sinon from "sinon";

import { onMarrainageSendNewcomerEmail } from "./onMarrainageSendNewcomerEmailEvent";
import { MarrainageNewcomerEmailEvent, MARRAINAGE_EVENT } from "../../../models/marrainage/marrainageEvent";
import * as Email from '../../../config/email.config'
import db from "../../../db";
import { CommunicationEmailCode, DBUser } from "../../../models/dbUser";
import { EMAIL_TYPES, MarrainageNewcomerEmail } from "@modules/email";

describe('Test marrainage send newcomer email', () => {
    it('should send email to newcomer email', async () => {
        const newcomer = 'membre.nouveau'
        const [user] : DBUser[] = await db('users').where({ username: newcomer })
        const evt : MarrainageNewcomerEmailEvent = {
            type: MARRAINAGE_EVENT.MARRAINAGE_SEND_NEWCOMER_EMAIL,
            user: user.username
        }
        await onMarrainageSendNewcomerEmail(evt)
        const sendEmail = sinon.spy(Email, 'sendEmail');
        const email : MarrainageNewcomerEmail = {
            type: EMAIL_TYPES.MARRAINAGE_NEWCOMER_EMAIL,
            variables: {
                member: {
                    ...user
                },
            },
            extraParams: {},
            attachments: [],
            toEmail: [user.communication_email === CommunicationEmailCode.PRIMARY ? user.primary_email : user.secondary_email],
        }
        sendEmail.calledOnceWith(email)
        sendEmail.restore()
    })
})
