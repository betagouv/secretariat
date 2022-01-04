import ejs from 'ejs';
import BetaGouv, { OvhRedirection } from '../betagouv';
import * as utils from '../controllers/utils';
import knex from '../db';
import * as mattermost from '../lib/mattermost';
import { renderHtmlFromMd } from '../lib/mdtohtml';
import { DBUser } from '../models/dbUser';
import { Member, MemberWithPrimaryEmailAndMattermostUsername } from '../models/member';
import betagouv from '../betagouv';

interface MessageConfig {
  days: number,
  emailFile: string
}

// get users that are member (got a github card) and mattermost account that is not in the team
const getRegisteredUsersWithEndingContractInXDays =  async (days) : Promise<MemberWithPrimaryEmailAndMattermostUsername[]> => {
  const allMattermostUsers = await mattermost.getUserWithParams();
  const users = await BetaGouv.usersInfos();
  const activeGithubUsers = users.filter((user) => {
    const today = new Date();
    const todayMoreXDays = new Date();
    todayMoreXDays.setDate(today.getDate() + days);
    todayMoreXDays.setHours(0, 0, 0, 0);
    // filter user that have have been created after implementation of this function
    const stillActive = !utils.checkUserIsExpired(user);
    const userEndDate = new Date(user.end)
    userEndDate.setHours(0, 0, 0, 0)
    return (
      stillActive && userEndDate.getTime() === todayMoreXDays.getTime()
    );
  });
  const allMattermostUsersEmails = allMattermostUsers.map(
    (mattermostUser) => mattermostUser.email
  );
  const dbUsers: DBUser[] = await knex('users')
  .whereIn(
    'username',
    activeGithubUsers.map((user) => user.id)
  );
  const registeredUsersWithEndingContractInXDays = dbUsers.map(
    (user) => {
      const index = allMattermostUsersEmails.indexOf(
        user.primary_email
      );
      const githubUser = activeGithubUsers.find(ghUser => ghUser.id === user.username)
      return {
        ...githubUser,
        primary_email: user.primary_email,
        mattermostUsername: index > -1 ? allMattermostUsers[index].username : undefined,
      };
    }
  );
  return registeredUsersWithEndingContractInXDays.filter(
    (user) => user.mattermostUsername
  ) as MemberWithPrimaryEmailAndMattermostUsername[];
};

const CONFIG_MESSAGE = {
  mail15days: {
    emailFile: 'mail15days.ejs',
    days: 15,
  },
  mail2days: {
    emailFile: 'mail2days.ejs',
    days: 2,
  },
};

const EMAIL_FILES = {
  'j+1': 'mailExpired1day',
  'j+30': 'mailExpired30days',
};

const sendMessageOnChatAndEmail = async (user: MemberWithPrimaryEmailAndMattermostUsername, messageConfig: MessageConfig) => {
  const messageContent = await ejs.renderFile(
    `./views/emails/${messageConfig.emailFile}`,
    {
      user,
    }
  );
  try {
    await BetaGouv.sendInfoToChat(
      messageContent,
      'secretariat',
      user.mattermostUsername
    );
    console.log(
      `Send ending contract (${messageConfig.days} days) message on mattermost to ${user.mattermostUsername}`
    );
  } catch (err) {
    throw new Error(`Erreur d'envoi de mail à l'adresse indiquée ${err}`);
  }
  try {
    const email = user.primary_email;
    await utils.sendMail(
      email,
      `Départ dans ${messageConfig.days} jours 🙂`,
      renderHtmlFromMd(messageContent)
    );
    console.log(
      `Send ending contract (${messageConfig.days} days) email to ${email}`
    );
  } catch (err) {
    throw new Error(`Erreur d'envoi de mail à l'adresse indiquée ${err}`);
  }
};

export async function sendContractEndingMessageToUsers(
  configName: string,
  users = null
) {
  console.log('Run send contract ending message to users');
  const messageConfig = CONFIG_MESSAGE[configName];
  let registeredUsersWithEndingContractInXDays : MemberWithPrimaryEmailAndMattermostUsername[];
  if (users) {
    registeredUsersWithEndingContractInXDays = users;
  } else {
    registeredUsersWithEndingContractInXDays =
      await getRegisteredUsersWithEndingContractInXDays(messageConfig.days);
  }
  await Promise.all(
    registeredUsersWithEndingContractInXDays.map(async (user) => {
      await sendMessageOnChatAndEmail(user, messageConfig);
    })
  );
}

export async function sendInfoToSecondaryEmailAfterXDays(
  nbDays,
  optionalExpiredUsers?: Member[]
) {
  let expiredUsers = optionalExpiredUsers;
  if (!expiredUsers) {
    const users = await BetaGouv.usersInfos();
    expiredUsers = utils.getExpiredUsersForXDays(users, nbDays);
  }
  return Promise.all(
    expiredUsers.map(async (user) => {
      try {
        const dbResponse = await knex('users')
          .select('secondary_email')
          .where({ username: user.id });
        if (dbResponse.length === 1 && dbResponse[0].secondary_email) {
          const email = dbResponse[0].secondary_email;
          const messageContent = await ejs.renderFile(
            `./views/emails/${EMAIL_FILES[`j+${nbDays}`]}.ejs`,
            {
              user,
            }
          );
          await utils.sendMail(email, 'A bientôt 🙂', messageContent);
          console.log(`Envoie du message fin de contrat +${nbDays} à ${email}`);
        } else {
          console.error(`Le compte ${user.id} n'a pas d'adresse secondaire`);
        }
      } catch (err) {
        throw new Error(`Erreur d'envoi de mail à l'adresse indiquée ${err}`);
      }
    })
  );
}

export async function sendJ1Email(users) {
  return module.exports.sendInfoToSecondaryEmailAfterXDays(1, users);
}

export async function sendJ30Email(users) {
  return module.exports.sendInfoToSecondaryEmailAfterXDays(30, users);
}

export async function deleteOVHEmailAcounts(optionalExpiredUsers?: Member[]) {
  let expiredUsers: Member[] = optionalExpiredUsers;
  if (!expiredUsers) {
    const users: Member[] = await BetaGouv.usersInfos();
    const allOvhEmails = await BetaGouv.getAllEmailInfos();
    expiredUsers = users.filter((user) => {
      return (
        utils.checkUserIsExpired(user, 30) && allOvhEmails.includes(user.id)
      );
    });
  }
  for (const user of expiredUsers) {
    try {
      await BetaGouv.deleteEmail(user.id);
      console.log(`Suppression de l'email ovh pour ${user.id}`);
    } catch {
      console.log(
        `Erreur lors de la suppression de l'email ovh pour ${user.id}`
      );
    }
  }
}

export async function deleteSecondaryEmailsForUsers(
  optionalExpiredUsers?: Member[]
) {
  let expiredUsers: Member[] = optionalExpiredUsers;
  if (!expiredUsers) {
    const users: Member[] = await BetaGouv.usersInfos();
    expiredUsers = users.filter((user) => utils.checkUserIsExpired(user, 30));
  }
  const dbUsers: DBUser[] = await knex('users')
    .whereNotNull('secondary_email')
    .whereIn(
      'username',
      expiredUsers.map((user) => user.id)
    );
  for (const user of dbUsers) {
    try {
      await knex('users')
        .update({
          secondary_email: null,
        })
        .where({
          username: user.username,
        });
      console.log(`Suppression de secondary_email pour ${user.username}`);
    } catch {
      console.log(
        `Erreur lors de la suppression de secondary_email pour ${user.username}`
      );
    }
  }
}

export async function deleteRedirectionsAfterQuitting(
  check_all = false
): Promise<unknown[]> {
  const users: Member[] = await BetaGouv.usersInfos();
  const expiredUsers: Member[] = check_all
    ? utils.getExpiredUsers(users, 1)
    : utils.getExpiredUsersForXDays(users, 1);

  return Promise.all(
    expiredUsers.map(async (user) => {
      try {
        const redirections = await BetaGouv.redirectionsForId({
          from: user.id,
        });

        console.log(`Suppression des redirections pour ${user.fullname}`);

        redirections.map(
          async (r: OvhRedirection) =>
            await BetaGouv.deleteRedirection(
              utils.buildBetaEmail(user.id),
              r.to
            )
        );
      } catch (err) {
        console.log(
          `Impossible de modifier les redirections pour ${user.fullname}: ${err}`
        );
      }
    })
  );
}
const removeEmailFromMailingList = async (userId: string, mailingList:string[]) => {
  return Promise.all(mailingList.map(async (mailing: string) => {
    try {
      await BetaGouv.removeFromMailingList(mailing, utils.buildBetaEmail(userId))
      console.log(`Suppression de ${utils.buildBetaEmail(userId)} de la mailing list ${mailing}`)
    } catch (err) {
      console.error(`Erreur lors de la suppression de l'email ${utils.buildBetaEmail(userId)} de la mailing list ${mailing}  : ${err}`)
    }
  }))
}

export async function removeEmailsFromMailingList(optionalExpiredUsers?: Member[], nbDays=30) {
  let expiredUsers: Member[] = optionalExpiredUsers;
  if (!expiredUsers) {
    const users: Member[] = await BetaGouv.usersInfos();
    expiredUsers = utils.getExpiredUsersForXDays(users, nbDays)
  }
  const mailingList: string[] = await betagouv.getAllMailingList()
  for (const user of expiredUsers) {
     await removeEmailFromMailingList(user.id, mailingList)
  }
}

