import { buildBetaEmail } from '@controllers/utils';
import Betagouv from '@/betagouv'
import knex from '@/db';
import { Member } from '@models/member';

const createMissingActiveUserInDb = async() => {
    const activeUsers: Member[] = await Betagouv.getActiveRegisteredOVHUsers();
    for (const user of activeUsers) {
        try {
            const users = await knex('users').where({ username: user.id }).first()
            if (!users) {
                console.log(`User ${user.id} is active but not in bdd`)
                await knex('users').insert({
                    username: user.id,
                    primary_email: buildBetaEmail(user.id)
                })
            }
        } catch (e) {
            // error
        }
    }
}

createMissingActiveUserInDb()
