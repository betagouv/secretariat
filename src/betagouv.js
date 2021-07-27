// betagouv.js
// ======
const axios = require('axios').default;
const ovh = require('ovh')({
  appKey: process.env.OVH_APP_KEY,
  appSecret: process.env.OVH_APP_SECRET,
  consumerKey: process.env.OVH_CONSUMER_KEY,
});
const config = require('./config');

const betaGouv = {
  sendInfoToChat: async (text, channel, username) => {
    let hookURL = config.slackWebhookURLSecretariat;
    const params = { text };
    if (channel === 'general') {
      hookURL = config.slackWebhookURLGeneral;
    }
    if (username) {
      params.channel = `@${username}`;
    }
    try {
      return await axios.post(hookURL, params);
    } catch (err) {
      throw new Error(`Error to notify slack: ${err}`);
    }
  },
  usersInfos: async () => axios.get(config.usersAPI).then((response) => response.data.map((author) => {
    if (author.missions && author.missions.length > 0) {
      const sortedStartDates = author.missions.map((x) => x.start).sort();
      const sortedEndDates = author.missions.map((x) => x.end || '').sort().reverse();
      const latestMission = author.missions.reduce((a, v) => (v.end > a.end || !v.end ? v : a));

      [author.start] = sortedStartDates;
      author.end = sortedEndDates.includes('') ? '' : sortedEndDates[0];
      author.employer = latestMission.status ? `${latestMission.status}/${latestMission.employer}` : latestMission.employer;
    }
    return author;
  })).catch((err) => {
    throw new Error(`Error to get users infos in ${config.domain}: ${err}`);
  }),
  userInfosById: async (id) => {
    const users = await betaGouv.usersInfos();
    return users.find((user) => user.id === id);
  },
  startupsInfos: async () => axios.get(config.startupsAPI)
    .then((x) => x.data.data) // data key
    .catch((err) => {
      throw new Error(`Error to get startups infos in ${config.domain}: ${err}`);
    }),
};

const betaOVH = {
  emailInfos: async (id) => {
    const url = `/email/domain/${config.domain}/account/${id}`;

    try {
      return await ovh.requestPromised('GET', url, {});
    } catch (err) {
      if (err.error === 404) return null;
      throw new Error(`OVH Error GET on ${url} : ${JSON.stringify(err)}`);
    }
  },
  getAllEmailInfos: async () => { // https://eu.api.ovh.com/console/#/email/domain/%7Bdomain%7D/account#GET
    // result is an array of the users ids : ['firstname1.lastname1', 'firstname2.lastname2', ...]
    const url = `/email/domain/${config.domain}/account/`;

    try {
      return await ovh.requestPromised('GET', url, {});
    } catch (err) {
      throw new Error(`OVH Error GET on ${url} : ${JSON.stringify(err)}`);
    }
  },
  // get active users with email registered on ovh
  getActiveRegisteredOVHUsers: async () => {
    const users = await betaGouv.usersInfos();
    const allOvhEmails = await betaOVH.getAllEmailInfos();
    const { checkUserIsExpired } = require('./controllers/utils');
    const activeUsers = users.filter(
      (user) => !checkUserIsExpired(user.id) && allOvhEmails.includes(user.id),
    );
    return activeUsers;
  },
  createEmail: async (id, password) => {
    const url = `/email/domain/${config.domain}/account`;

    try {
      console.log(`OVH POST ${url} name=${id}`);

      return await ovh.requestPromised('POST', url, {
        accountName: id,
        password,
      });
    } catch (err) {
      throw new Error(`OVH Error POST on ${url} : ${JSON.stringify(err)}`);
    }
  },
  deleteEmail: async (id, password) => {
    const url = `/email/domain/${config.domain}/account/${id}`;

    try {
      console.log(`OVH DELETE ${url}`);

      return await ovh.requestPromised('DELETE', url);
    } catch (err) {
      throw new Error(`OVH Error DELETE on ${url} : ${JSON.stringify(err)}`);
    }
  },
  createRedirection: async (from, to, localCopy) => {
    const url = `/email/domain/${config.domain}/redirection`;

    try {
      console.log(`OVH POST ${url} from+${from} &to=${to}`);

      return await ovh.requestPromised('POST', url, { from, to, localCopy });
    } catch (err) {
      throw new Error(`OVH Error POST on ${url} : ${JSON.stringify(err)}`);
    }
  },
  requestRedirection: async (method, redirectionId) => ovh.requestPromised(
    method,
    `/email/domain/${config.domain}/redirection/${redirectionId}`,
  ),
  /* eslint arrow-body-style: "warn" */
  requestRedirections: async (method, redirectionIds) => Promise.all(redirectionIds.map((x) => betaOVH.requestRedirection(method, x))),
  redirectionsForId: async (query) => {
    if (!query.from && !query.to) {
      throw new Error('paramètre \'from\' ou \'to\' manquant');
    }

    const url = `/email/domain/${config.domain}/redirection`;

    const options = {};

    if (query.from) {
      options.from = `${query.from}@${config.domain}`;
    }

    if (query.to) {
      options.to = `${query.to}@${config.domain}`;
    }

    try {
      const redirectionIds = await ovh.requestPromised('GET', url, options);

      return await betaOVH.requestRedirections('GET', redirectionIds);
    } catch (err) {
      throw new Error(`OVH Error on ${url} : ${JSON.stringify(err)}`);
    }
  },
  deleteRedirection: async (from, to) => {
    const url = `/email/domain/${config.domain}/redirection`;

    try {
      const redirectionIds = await ovh.requestPromised('GET', url, {
        from,
        to,
      });

      return await betaOVH.requestRedirections('DELETE', redirectionIds);
    } catch (err) {
      throw new Error(`OVH Error on deleting ${url} : ${JSON.stringify(err)}`);
    }
  },
  redirections: async () => {
    const url = `/email/domain/${config.domain}/redirection`;

    try {
      const redirectionIds = await ovh.requestPromised('GET', url);

      return await betaOVH.requestRedirections('GET', redirectionIds);
    } catch (err) {
      throw new Error(`OVH Error on ${url} : ${JSON.stringify(err)}`);
    }
  },
  accounts: async () => {
    const url = `/email/domain/${config.domain}/account`;

    try {
      return await ovh.requestPromised('GET', url, {});
    } catch (err) {
      if (err.error === 404) return null;
      throw new Error(`OVH Error GET on ${url} : ${JSON.stringify(err)}`);
    }
  },
  changePassword: async (id, password) => {
    const url = `/email/domain/${config.domain}/account/${id}/changePassword`;

    try {
      await ovh.requestPromised('POST', url, { password });
    } catch (err) {
      throw new Error(`OVH Error on ${url} : ${JSON.stringify(err)}`);
    }
  },
};

module.exports = { ...betaGouv, ...betaOVH };
