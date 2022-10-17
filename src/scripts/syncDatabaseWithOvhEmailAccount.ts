import betagouv from "../betagouv";
import knex from "../db";
import { DBUser, EmailStatusCode } from "@/models/dbUser/dbUser";
import { Member } from "@models/member";

const syncDatabaseWithOvhEmailAccount = async () => {
    const users : Member[] = await betagouv.usersInfos();
    const usernames : string[] = users.map(user => user.id);
    const ovhAccounts : string[] = await betagouv.accounts();
    const usernamesWithoutOvhEmailAccount = usernames.filter(
        username => !ovhAccounts.includes(username));
    const dbUsers: DBUser[] = await knex('users')
        .whereIn(
        'username', usernamesWithoutOvhEmailAccount
        ).andWhere({
            primary_email_status: EmailStatusCode.EMAIL_ACTIVE
        })
    console.log('Will set primary_email_status to deleted for users :', dbUsers.map(user => user.username))
    if (process.env.APPLY_SYNC_DATABASE_WITH_OVH_EMAIL_ACOUNT) {
        await knex('users')
            .whereIn(
            'username', dbUsers.map(user => user.username)
            )
            .andWhere({
                primary_email_status: EmailStatusCode.EMAIL_ACTIVE
            })
            .update({
                primary_email_status: EmailStatusCode.EMAIL_DELETED
            })
    }
}

syncDatabaseWithOvhEmailAccount()
