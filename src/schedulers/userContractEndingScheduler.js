const ejs = require('ejs');
const mattermost = require('../lib/mattermost');
const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('../controllers/utils');

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
    return stillActive && (new Date(user.end)).getTime() === todayMoreXDays.getTime();
  });
  const allMattermostUsersEmails = allMattermostUsers.map((mattermostUser) => mattermostUser.email);
  const registeredUsersWithEndingContractInXDays = activeGithubUsers.map(
    (user) => {
      const index = allMattermostUsersEmails.indexOf(utils.buildBetaEmail(user.id));
      if (index > -1) {
        return {
          ...user,
          mattermostUsername: allMattermostUsers[index].username,
        };
      }
      return user;
    },
  );
  return registeredUsersWithEndingContractInXDays.filter((user) => user.mattermostUsername);
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
  const html = await ejs.renderFile(`./views/emails/${messageConfig.emailFile}`, {
    user,
  });
  try {
    await BetaGouv.sendInfoToChat(html, 'secretariat', user.mattermostUsername);
    console.log(`Send ending contract (${messageConfig.days} days) message on mattermost to ${user.mattermostUsername}`)
  } catch (err) {
    throw new Error(`Erreur d'envoi de mail à l'adresse indiqué ${err}`);
  }
  try {
    const email = utils.buildBetaEmail(user.id)
    await utils.sendMail(email, `Départ dans ${messageConfig.days} jours 🙂`, html);
    console.log(`Send ending contract (${messageConfig.days} days) email to ${email}`)
  } catch (err) {
    throw new Error(`Erreur d'envoi de mail à l'adresse indiqué ${err}`);
  }
};

module.exports.onUserContractEnding = async (configName, users) => {
  const messageConfig = CONFIG_MESSAGE[configName];
  let registeredUsersWithEndingContractInXDays;
  if (users) {
    registeredUsersWithEndingContractInXDays = users;
  } else {
    registeredUsersWithEndingContractInXDays = await getRegisteredUsersWithEndingContractInXDays(messageConfig.days);
  }
  await Promise.all(registeredUsersWithEndingContractInXDays.map(async (user) => sendMessageOnChatAndEmail(user, messageConfig)));
};
