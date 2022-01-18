import crypto from 'crypto';
import _ from 'lodash/array';
import BetaGouv from '../betagouv';
import { createEmail, setEmailActive, setEmailSuspended } from '../controllers/usersController';
import * as utils from '../controllers/utils';
import knex from '../db';
import { DBUser, EmailStatusCode } from '../models/dbUser';
import { Member } from '../models/member';

const differenceGithubOVH = function differenceGithubOVH(user, ovhAccountName) {
  return user.id === ovhAccountName;
};

const getValidUsers = async () => {
  const githubUsers = await BetaGouv.usersInfos();
  return githubUsers.filter((x) => !utils.checkUserIsExpired(x));
};

export async function setEmailAddressesActive() {
  const tenMinutesInMs : number = 10 * 1000 * 60
  const nowLessTenMinutes : Date = new Date(Date.now() - tenMinutesInMs)
  const dbUsers : DBUser[] = await knex('users')
    .whereIn('primary_email_status', [EmailStatusCode.EMAIL_CREATION_PENDING, EmailStatusCode.EMAIL_RECREATION_PENDING])
    .where('primary_email_status_updated_at', '<', nowLessTenMinutes)
    const githubUsers: Member[] = await getValidUsers();
  const concernedUsers : DBUser[] = dbUsers.filter((user) => {
    console.log('LCS SET EMAIL ADRESSES', user, githubUsers)
    return githubUsers.find((x) => user.username === x.id);
  })
  return Promise.all(
    concernedUsers.map(async (user) => {
      await setEmailActive(user.username)
      // once email created we create marrainage
    })
  );
}

export async function createEmailAddresses() {
  const dbUsers : DBUser[] = await knex('users')
    .whereNull('primary_email')
    .whereNotNull('secondary_email')
  const githubUsers: Member[] = await getValidUsers();

  const concernedUsers : Member[] = githubUsers.filter((user) => {
    return dbUsers.find((x) => x.username === user.id);
  })

  const allOvhEmails : string[] = await BetaGouv.getAllEmailInfos();
  const unregisteredUsers : Member[] = _.differenceWith(
    concernedUsers,
    allOvhEmails,
    differenceGithubOVH
  );
  console.log(
    `Email creation : ${unregisteredUsers.length} unregistered user(s) in OVH (${allOvhEmails.length} accounts in OVH. ${githubUsers.length} accounts in Github).`
  );

  // create email and marrainage
  return Promise.all(
    unregisteredUsers.map(async (user) => {
        await createEmail(user.id, 'Secretariat cron')
      // once email created we create marrainage
    })
  );
}

export async function reinitPasswordEmail() {
  const users : Member[] = await BetaGouv.usersInfos();
  const expiredUsers : Member[] = utils.getExpiredUsers(users, 1);
  const dbUsers : DBUser[] = await knex('users')
    .whereIn(
      'username', expiredUsers.map(user => user.id)
    )
    .andWhere({
      primary_email_status: EmailStatusCode.EMAIL_ACTIVE
    }
  )

  return Promise.all(
    dbUsers.map(async (user) => {
      const newPassword = crypto
        .randomBytes(16)
        .toString('base64')
        .slice(0, -2);
      try {
        await BetaGouv.changePassword(user.username, newPassword);
        await setEmailSuspended(user.username)
        console.log(
          `Le mot de passe de ${user.username} a été modifié car son contrat finissait le ${new Date()}.`
        );
      } catch (err) {
        console.log(
          `Le mode de passe de ${user.username} n'a pas pu être modifié: ${err}`
        );
      }
    })
  );
}
