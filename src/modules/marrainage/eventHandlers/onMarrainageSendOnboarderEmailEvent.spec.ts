import sinon from "sinon";

import { onMarrainageSendOnboarderEmail } from "./onMarrainageSendOnboarderEmailEvent";
import { MarrainageOnboarderEmailEvent, MARRAINAGE_EVENT } from "../../../models/marrainage/marrainageEvent";
import * as Email from '../../../config/email.config'
import db from "../../../db";
import { CommunicationEmailCode, DBUser } from "../../../models/dbUser";
import { EMAIL_TYPES, MarrainageOnboarderEmail } from "../../../modules/email";

describe('Test marrainage send onboarder email', () => {
    it('should send email to onboarder email', async () => {
        const onboarder = 'membre.nouveau'
        const [user] : DBUser[] = await db('users').where({ username: onboarder })
        const evt : MarrainageOnboarderEmailEvent = {
            type: MARRAINAGE_EVENT.MARRAINAGE_SEND_ONBOARDER_EMAIL,
            user: user.username
        }
        await onMarrainageSendOnboarderEmail(evt)
        const sendEmail = sinon.spy(Email, 'sendEmail');
        const email : MarrainageOnboarderEmail = {
            type: EMAIL_TYPES.MARRAINAGE_ONBOARDER_EMAIL,
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
