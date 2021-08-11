import crypto from 'crypto';
import _ from 'lodash/array';
import BetaGouv from '../betagouv';
import { createRequestForUser } from '../controllers/marrainageController';
import { createEmail } from '../controllers/usersController';
import * as utils from '../controllers/utils';
import knex from '../db';

export async function createEmailAndMarrainage(user, creator) {
  await createEmail(user.id, creator, user.toEmail);
  // once email is created we generate marrainage request
  const dateInTwoMonth = new Date();
  dateInTwoMonth.setMonth(dateInTwoMonth.getMonth() + 2);
  const userStartDate = new Date(user.start);
  if (userStartDate < dateInTwoMonth) {
    try {
      // create marrainage request
      await createRequestForUser(user.id);
    } catch (e) {
      // marrainage may fail if no member available
      console.warn(e);
    }
  }
}

const differenceGithubOVH = function differenceGithubOVH(user, ovhAccountName) {
  return user.id === ovhAccountName;
};

const getValidUsers = async () => {
  const githubUsers = await BetaGouv.usersInfos();
  return githubUsers.filter((x) => !utils.checkUserIsExpired(x));
};

export async function createEmailAddresses() {
  const dbUsers = await knex('users').whereNotNull('secondary_email');

  const githubUsers = await getValidUsers();

  const concernedUsers = githubUsers.reduce((acc, user) => {
    const dbUser = dbUsers.find((x) => x.username === user.id);
    if (dbUser) {
      acc.push({ ...user, ...{ toEmail: dbUser.secondary_email } });
    }
    return acc;
  }, []);

  const allOvhEmails = await BetaGouv.getAllEmailInfos();
  const unregisteredUsers = _.differenceWith(concernedUsers, allOvhEmails, differenceGithubOVH);
  console.log(`Email creation : ${unregisteredUsers.length} unregistered user(s) in OVH (${allOvhEmails.length} accounts in OVH. ${githubUsers.length} accounts in Github).`);

  // create email and marrainage
  return Promise.all(
    unregisteredUsers.map((user) =>
      createEmailAndMarrainage(user, 'Secretariat Cron')
    )
  );
}

export async function reinitPasswordEmail() {
  const users = await BetaGouv.usersInfos();
  const expiredUsers = utils.getExpiredUsersForXDays(users, 1);

  return Promise.all(
    expiredUsers.map(async (user) => {
      const newPassword = crypto
        .randomBytes(16)
        .toString('base64')
        .slice(0, -2);
      try {
        await BetaGouv.changePassword(user.id, newPassword);
        console.log(
          `Le mot de passe de ${user.fullname} a été modifié car son contrat finissait le ${user.end}.`
        );
      } catch (err) {
        console.log(
          `Le mode de passe de ${user.fullname} n'a pas pu être modifié: ${err}`
        );
      }
    })
  );
}
