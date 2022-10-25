import BetaGouv, { OvhRedirection } from '@/betagouv';
import * as utils from '@controllers/utils';
import knex from '@/db';
import * as mattermost from '@/lib/mattermost';
import { CommunicationEmailCode, DBUser, EmailStatusCode } from '@/models/dbUser/dbUser';
import { Member, MemberWithEmailsAndMattermostUsername } from '@models/member';
import betagouv from '@/betagouv';
import { sleep } from '@controllers/utils';
import { Job } from '@models/job';
import { EmailEndingContract, EmailNoMoreContract, EMAIL_TYPES, MAILING_LIST_TYPE } from '@/modules/email';
import { sendEmail } from '@/config/email.config';
import htmlBuilder from '@/modules/htmlbuilder/htmlbuilder';
import { removeContactsFromMailingList } from '@/infra/email/sendInBlue';
import db from '@/db';

// get users that are member (got a github card) and mattermost account that is not in the team
const getRegisteredUsersWithEndingContractInXDays =  async (days) : Promise<MemberWithEmailsAndMattermostUsername[]> => {
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
        secondary_email: user.secondary_email,
        communication_email: user.communication_email,
        mattermostUsername: index > -1 ? allMattermostUsers[index].username : undefined,
      };
    }
  );
  return registeredUsersWithEndingContractInXDays.filter(
    (user) => user.mattermostUsername
  ) as MemberWithEmailsAndMattermostUsername[];
};


const CONFIG_ENDING_CONTRACT_MESSAGE : Record<string, {
  type: EmailEndingContract['type'],
  days: number
}> = {
  mail2days: {
    type: EMAIL_TYPES.EMAIL_ENDING_CONTRACT_2_DAYS,
    days: 2
  },
  mail15days: {
    type: EMAIL_TYPES.EMAIL_ENDING_CONTRACT_15_DAYS,
    days: 15
  },
  mail30days: {
    type: EMAIL_TYPES.EMAIL_ENDING_CONTRACT_30_DAYS,
    days: 30
  }
};

const CONFIG_NO_MORE_CONTRACT_MESSAGE : Record<string, EmailNoMoreContract['type']> = {
  'j+1': EMAIL_TYPES.EMAIL_NO_MORE_CONTRACT_1_DAY,
  'j+30': EMAIL_TYPES.EMAIL_NO_MORE_CONTRACT_30_DAY
} ; 

const sendMessageOnChatAndEmail = async ({
  user,
  messageType,
  jobs,
  sendToSecondary
}:{
  user: MemberWithEmailsAndMattermostUsername,
  messageType: EmailEndingContract['type'],
  jobs: Job[],
  sendToSecondary: boolean}) => {
  const contentProps = {
    type: messageType,
    variables: {
      user,
      jobs: user.domaine ? jobs.filter(job => job.domaines.includes(user.domaine)).slice(0, 3) : [],
    }
  }
  const messageContent = await htmlBuilder.renderContentForTypeAsMarkdown(contentProps)    
  try {
    await BetaGouv.sendInfoToChat(
      messageContent,
      'secretariat',
      user.mattermostUsername
    );
    console.log(
      `Send ending contract (${messageType} days) message on mattermost to ${user.mattermostUsername}`
    );
    sleep(1000)
  } catch (err) {
    throw new Error(`Erreur d'envoi de mail à l'adresse indiquée ${err}`);
  }
  try {
    let email = user.primary_email;
    if ((sendToSecondary || user.communication_email === CommunicationEmailCode.SECONDARY) && user.secondary_email) {
      email = `${email},${user.secondary_email}`
    }
    await sendEmail({
      ...contentProps,
      toEmail: email.split(','),
    })
    console.log(
      `Send ending contract (${messageType} days) email to ${email}`
    );
  } catch (err) {
    throw new Error(`Erreur d'envoi de mail à l'adresse indiquée ${err}`);
  }
};

export async function sendContractEndingMessageToUsers(
  configName: string,
  sendToSecondary = false,
  users = null
) {
  console.log('Run send contract ending message to users');
  const messageConfig = CONFIG_ENDING_CONTRACT_MESSAGE[configName];
  let registeredUsersWithEndingContractInXDays : MemberWithEmailsAndMattermostUsername[];
  if (users) {
    registeredUsersWithEndingContractInXDays = users;
  } else {
    registeredUsersWithEndingContractInXDays =
      await getRegisteredUsersWithEndingContractInXDays(messageConfig.days);
  }
  const jobs: Job[] = await BetaGouv.getJobs()
  await Promise.all(
    registeredUsersWithEndingContractInXDays.map(async (user) => {
      await sendMessageOnChatAndEmail({
        user, 
        messageType: messageConfig.type,
        sendToSecondary,
        jobs
      });
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
          await sendEmail({
            type: CONFIG_NO_MORE_CONTRACT_MESSAGE[nbDays],
            toEmail: [email], 
            variables: {
              user
            }
          });
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
  let dbUsers : DBUser[];
  if (!expiredUsers) {
    const users: Member[] = await BetaGouv.usersInfos();
    const allOvhEmails = await BetaGouv.getAllEmailInfos();
    expiredUsers = users.filter((user) => {
      return (
        utils.checkUserIsExpired(user, 30) && allOvhEmails.includes(user.id)
      );
    });
    const today = new Date();
    const todayLess30days = new Date()
    todayLess30days.setDate(today.getDate() - 30)
    dbUsers = await knex('users')
      .whereIn('username', expiredUsers.map(user => user.id))
      .andWhere({ primary_email_status: EmailStatusCode.EMAIL_SUSPENDED })
      .where('primary_email_status_updated_at', '<', todayLess30days)
  }
  console.log(`Liste d'utilisateur à supprimer`, dbUsers.map(user => user.username), expiredUsers.map(user => user.id))
  for (const user of dbUsers) {
    try {
      await BetaGouv.deleteEmail(user.username);
      await knex('users').where({
        username: user.username
      }).update({
        primary_email_status: EmailStatusCode.EMAIL_DELETED
      })
      console.log(`Suppression de l'email ovh pour ${user.username}`);
    } catch {
      console.log(
        `Erreur lors de la suppression de l'email ovh pour ${user.username}`
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
  const today = new Date();
  const todayLess30days = new Date()
  todayLess30days.setDate(today.getDate() - 30)
  const dbUsers: DBUser[] = await knex('users')
    .whereNotNull('secondary_email')
    .whereIn('primary_email_status', [EmailStatusCode.EMAIL_DELETED, EmailStatusCode.EMAIL_EXPIRED])
    .where('primary_email_status_updated_at', '<', todayLess30days)
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
      await BetaGouv.unsubscribeFromMailingList(mailing, utils.buildBetaEmail(userId))
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
    try {
      await removeEmailFromMailingList(user.id, mailingList)
    } catch(e) {
      console.error(e)
    }
  }
  const dbUsers: DBUser[] = await db('users').whereIn('username', expiredUsers.map(user => user.id))
  for (const user of dbUsers) {
    try {
      await removeContactsFromMailingList({
        emails: [user.primary_email, user.secondary_email],
        listType: MAILING_LIST_TYPE.NEWSLETTER
      })
    } catch(e) {
      console.error(e)
    }
    try {
      await removeContactsFromMailingList({
        emails: [user.primary_email, user.secondary_email],
        listType: MAILING_LIST_TYPE.ONBOARDING
      })
    } catch(e) {
      console.error(e)
    }
 }
}


