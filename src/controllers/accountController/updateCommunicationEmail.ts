import { addContactsToMailingLists, removeContactsFromMailingList } from "@/config/email.config";
import knex from "@/db";
import { CommunicationEmailCode, DBUser } from "@/models/dbUser";
import { MAILING_LIST_TYPE } from "@/modules/email";
import { addEvent, EventCode } from '@lib/events'
import { capitalizeWords } from "../utils";

export async function updateCommunicationEmail(req, res) {
  const { communication_email } = req.body;
  const username = req.auth.id
  try {
    const dbUser: DBUser = await knex('users').where({
      username,
    }).first()
    let previousCommunicationEmail = dbUser.communication_email
    let hasBothEmailsSet = dbUser.primary_email && dbUser.secondary_email
    if (communication_email != previousCommunicationEmail && hasBothEmailsSet) {
      await knex('users')
      .update({
        communication_email
      }).where({
        username
      })
      addEvent(EventCode.MEMBER_COMMUNICATION_EMAIL_UPDATE, {
        created_by_username: req.auth.id,
        action_on_username: username,
        action_metadata: {
          value: communication_email,
          old_value: dbUser ? dbUser.communication_email : null,
        }
      })
      await addContactsToMailingLists({
        contacts: [{
          email: communication_email === CommunicationEmailCode.PRIMARY ? dbUser.primary_email : dbUser.secondary_email,
          firstname: capitalizeWords(dbUser.username.split('.')[0]),
          lastname: capitalizeWords(dbUser.username.split('.')[1]),
        }],
        listTypes: [MAILING_LIST_TYPE.NEWSLETTER]
      })
      await removeContactsFromMailingList({
        emails: [previousCommunicationEmail === CommunicationEmailCode.PRIMARY ? dbUser.primary_email : dbUser.secondary_email],
        listType: MAILING_LIST_TYPE.NEWSLETTER
      })
      req.flash('message', 'Ton choix d\'email de communication a bien été mis à jour.');
      console.log(`${req.auth.id} a mis à jour son choix d'email de communication.`);
      res.redirect(`/account`);
    };
  } catch (err) {
    console.error(err);
    req.flash('error', err.message);
    res.redirect(`/account`);
  }
}