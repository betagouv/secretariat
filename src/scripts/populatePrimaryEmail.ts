import { buildBetaEmail } from '../controllers/utils';
import Betagouv from '../betagouv'
import knex from '../db';

const populatePrimaryEmail = async() => {
    const allOvhEmails = await Betagouv.getAllEmailInfos();
    for (const emailId of allOvhEmails) {
        await knex('users').insert({
            username: emailId,
            primary_email: buildBetaEmail(emailId)
        }).onConflict('username')
        .merge();
    }
}

populatePrimaryEmail()
