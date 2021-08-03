import ejs from 'ejs';
import * as mattermost from '../lib/mattermost';
import BetaGouv from '../betagouv';
import * as utils from '../controllers/utils';
import { renderHtmlFromMd } from '../lib/mdtohtml';

// get users that are member (got a github card) and mattermost account that is not in the team
const getRegisteredUsersWithEndingContractInXDays = async (days) => {
  const allMattermostUsers = await mattermost.getUserWithParams();
  const users = await BetaGouv.usersInfos();
  const activeGithubUsers = users.filter((user) => {
    const today = new Date();
    const todayMoreXDays = new Date();
    todayMoreXDays.setDate(today.getDate() + days);
    todayMoreXDays.setHours(0, 0, 0, 0);
    // filter user that have have been created after implementation of this function
    const stillActive = !utils.checkUserIsExpired(user);
    return (
      stillActive && new Date(user.end).getTime() === todayMoreXDays.getTime()
    );
  });
  const allMattermostUsersEmails = allMattermostUsers.map(
    (mattermostUser) => mattermostUser.email
  );
  const registeredUsersWithEndingContractInXDays = activeGithubUsers.map(
    (user) => {
      const index = allMattermostUsersEmails.indexOf(
        utils.buildBetaEmail(user.id)
      );
      if (index > -1) {
        return {
          ...user,
          mattermostUsername: allMattermostUsers[index].username,
        };
      }
      return user;
    }
  );
  return registeredUsersWithEndingContractInXDays.filter(
    (user) => user.mattermostUsername
  );
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

const sendMessageOnChatAndEmail = async (user, messageConfig) => {
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
    const email = utils.buildBetaEmail(user.id);
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
  let registeredUsersWithEndingContractInXDays;
  if (users) {
    registeredUsersWithEndingContractInXDays = users;
  } else {
    registeredUsersWithEndingContractInXDays =
      await getRegisteredUsersWithEndingContractInXDays(messageConfig.days);
  }
  console.log(registeredUsersWithEndingContractInXDays);
  await Promise.all(
    registeredUsersWithEndingContractInXDays.map(async (user) => {
      await sendMessageOnChatAndEmail(user, messageConfig);
    })
  );
}
