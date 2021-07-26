const { CronJob } = require('cron');
const ejs = require('ejs');
const generator = require('generate-password');
const mattermost = require('../lib/mattermost');
const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('../controllers/utils');

const getActiveGithubUsersUnregisteredOnMattermost = async () => {
  const allMattermostUsers = await mattermost.getUserWithParams();
  const activeGithubUsers = await BetaGouv.getActiveRegisteredOVHUsers();
  const allMattermostUsersEmails = allMattermostUsers.map((mattermostUser) => mattermostUser.email);
  const activeGithubUsersUnregisteredOnMattermost = activeGithubUsers.filter(
    (user) => !allMattermostUsersEmails.includes(utils.buildBetaEmail(user.id)),
  );
  return activeGithubUsersUnregisteredOnMattermost;
};

module.exports.inviteUsersToTeamByEmail = async () => {
  const activeGithubUsersUnregisteredOnMattermost = await getActiveGithubUsersUnregisteredOnMattermost();
  const results = await mattermost.inviteUsersToTeamByEmail(
    activeGithubUsersUnregisteredOnMattermost.map((user) => user.email).slice(0, 19), config.mattermostTeamId,
  );
  return results;
};

module.exports.reactivateUsers = async () => {
  const params = {};
  const isActive = false;
  const inactiveMattermostUsers = await mattermost.getInactiveMattermostUsers();

  const users = await BetaGouv.usersInfos();
  const currentUsers = users.filter((x) => {
    return !utils.checkUserIsExpired(x);
  });

  const currentUsersEmails = currentUsers.map((user) => `${user.id}@${config.domain}`);
  const mattermostUsersToReactivate = inactiveMattermostUsers.filter(({ email }) => {
    return currentUsersEmails.find((userMail) => userMail === email);
  });

  mattermostUsersToReactivate.forEach(async (member) => {
    const activedUser = await mattermost.activeUsers(member.id);
  });
  return mattermostUsersToReactivate;
};

const reactivateUsersJob = () => {
  if (config.featureReactiveMattermostUsers) {
    console.log(`🚀 The job reactiveMattermostUsers is started`);
    new CronJob(
      '0 0 10 * * 1-5', // monday through friday at 10:00:00
      this.reactivateUsers,
      null,
      true,
      'Europe/Paris',
    );
  } else {
    console.log(`❌ The job reactiveMattermostUsers is OFF`);
  };
};

reactivateUsersJob();

module.exports.createUsersByEmail = async () => {
  let activeGithubUsersUnregisteredOnMattermost = await getActiveGithubUsersUnregisteredOnMattermost();
  activeGithubUsersUnregisteredOnMattermost = activeGithubUsersUnregisteredOnMattermost.filter((user) => {
    const userStartDate = new Date(user.start).getTime();
    // filter user that have have been created after implementation of this function
    return userStartDate >= new Date('2021-07-08').getTime();
  });
  const results = await Promise.all(activeGithubUsersUnregisteredOnMattermost.map(async (user) => {
    const email = utils.buildBetaEmail(user.id);

    await mattermost.createUser({
      email,
      username: user.id,
      // mattermost spec : password must contain at least 10 character,
      // one lowercase, one upper, one number and a special character (amongst "~!@#$%^&*()").
      password: generator.generate({
        length: 20,
        uppercase: true,
        numbers: true,
        symbols: true,
        strict: true,
      }),
    });

    const html = await ejs.renderFile('./views/emails/mattermost.ejs', {
      resetPasswordLink: 'https://mattermost.incubateur.net/reset_password',
    });
    await utils.sendMail(email, 'Inscription à mattermost', html);
  }));
  return results;
};
