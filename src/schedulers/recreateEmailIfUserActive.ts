import betagouv from "@/betagouv";
import { createEmail } from "@/controllers/usersController";
import db from "@/db";
import { DBUser, EmailStatusCode } from "@/models/dbUser";
import { Member } from "@/models/member";
import * as Sentry from '@sentry/node';

export async function recreateEmailIfUserActive() {
    const activeUsers : Member[] = await betagouv.getActiveUsers()
    const dbUsers : DBUser[] = await db('users')
        .whereIn('username', activeUsers.map(user => user.id))
        .where({
            primary_email_status: EmailStatusCode.EMAIL_DELETED,
        })
        .whereNotNull('secondary_email')
    for (const dbUser of dbUsers) {
        try {
            await createEmail(dbUser.username, 'Secretariat cron')
            console.log(`Create email for ${dbUser.username}`)
        } catch(e) {
            console.error(e)
            Sentry.captureException(e);
        }
    }
}
