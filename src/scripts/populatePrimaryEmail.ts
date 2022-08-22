import { buildBetaEmail } from '@controllers/utils';
import Betagouv from '@/betagouv'
import knex from '@/db';

const populatePrimaryEmail = async() => {
    const allOvhEmails = await Betagouv.getAllEmailInfos();
    for (const emailId of allOvhEmails) {
        try {
            await knex('users').insert({
                username: emailId,
                primary_email: buildBetaEmail(emailId)
            })
            console.log('Add ', emailId)
        } catch (e) {
            // error
        }
    }
}

populatePrimaryEmail()
