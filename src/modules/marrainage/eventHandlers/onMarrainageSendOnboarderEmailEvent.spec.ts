import sinon from "sinon";

import { onMarrainageSendOnboarderEmail } from "./onMarrainageSendOnboarderEmailEvent";
import { EventEmailMarrainageOnboarder, MARRAINAGE_EVENT } from "@models/marrainage/marrainageEvent";
import * as Email from '@config/email.config'
import db from "../../../db";
import { CommunicationEmailCode, DBUser } from "@models/dbUser";
import { EmailProps, EMAIL_TYPES } from "@modules/email";
import betagouv from "../../../betagouv";
import { Member } from "@models/member";

describe('Test marrainage send onboarder email', () => {
    it('should send email to onboarder email', async () => {
        const onboarder = 'membre.nouveau'
        const [user] : DBUser[] = await db('users').where({ username: onboarder })
        const member : Member = await betagouv.userInfosById(onboarder)
        const evt : EventEmailMarrainageOnboarder = {
            type: MARRAINAGE_EVENT.MARRAINAGE_SEND_ONBOARDER_EMAIL,
            user: user.username,
            marrainage_group_id: 15157
        }
        await onMarrainageSendOnboarderEmail(evt)
        const sendEmail = sinon.spy(Email, 'sendEmail');
        const email : EmailProps = {
            type: EMAIL_TYPES.MARRAINAGE_ONBOARDER_EMAIL,
            variables: {
                member: {
                    ...member
                },
                newcomers: [{
                    fullname: 'membre.nouveau',
                    email: 'membre.nouveau@beta.gouv.fr'
                }]
            },
            extraParams: {},
            attachments: [],
            toEmail: [user.communication_email === CommunicationEmailCode.PRIMARY ? user.primary_email : user.secondary_email],
        }
        sendEmail.calledOnceWith(email)
        sendEmail.restore()
    })
})
