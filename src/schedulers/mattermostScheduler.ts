import { betaGouv, betaOVH } from "../betagouv";
import config from "../config";
import * as utils from "../controllers/utils";
import * as mattermost from "../lib/mattermost";
import generator from "generate-password";
import ejs from "ejs";
import { CronJob } from "cron";


const getActiveGithubUsersUnregisteredOnMattermost = async () => {
  const allMattermostUsers = await mattermost.getUserWithParams();
  const activeGithubUsers = await betaOVH.getActiveRegisteredOVHUsers();
  const allMattermostUsersEmails = allMattermostUsers.map((mattermostUser) => mattermostUser.email);
  const activeGithubUsersUnregisteredOnMattermost = activeGithubUsers.filter(
    (user) => !allMattermostUsersEmails.includes(utils.buildBetaEmail(user.id)),
  );
  return activeGithubUsersUnregisteredOnMattermost;
};

export async function inviteUsersToTeamByEmail() {
  const activeGithubUsersUnregisteredOnMattermost = await getActiveGithubUsersUnregisteredOnMattermost();
  const results = await mattermost.inviteUsersToTeamByEmail(
    activeGithubUsersUnregisteredOnMattermost.map((user) => user.email).slice(0, 19), config.mattermostTeamId,
  );
  return results;
}

export async function reactivateUsers() {
  const inactiveMattermostUsers = await mattermost.getInactiveMattermostUsers();

  const users = await betaGouv.usersInfos();
  const currentUsers = users.filter((x) => {
    return !utils.checkUserIsExpired(x);
  });

  const currentUsersEmails = currentUsers.map((user) => `${user.id}@${config.domain}`);
  const mattermostUsersToReactivate = inactiveMattermostUsers.filter(({ email }) => {
    return currentUsersEmails.find((userMail) => userMail === email);
  });

  for (const member of mattermostUsersToReactivate) {
    await mattermost.activeUsers(member.id);
  }
  return mattermostUsersToReactivate;
}

const reactivateUsersJob = () => {
  if (config.featureReactiveMattermostUsers) {
    console.log(`🚀 The job reactiveMattermostUsers is started`);
    new CronJob(
      '0 0 10 * * 1-5', // monday through friday at 10:00:00
      reactivateUsers,
      null,
      true,
      'Europe/Paris',
    );
  } else {
    console.log(`❌ The job reactiveMattermostUsers is OFF`);
  };
};

reactivateUsersJob();

export async function createUsersByEmail() {
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
        length: 10,
        uppercase: true,
        numbers: true,
        symbols: true,
      }),
    });

    const html = await ejs.renderFile('./views/emails/mattermost.ejs', {
      resetPasswordLink: 'https://mattermost.incubateur.net/reset_password',
    });
    await utils.sendMail(email, 'Inscription à mattermost', html);
  }));
  return results;
}
