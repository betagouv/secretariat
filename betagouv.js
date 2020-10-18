// betagouv.js
// ======
const axios = require('axios').default;
const ovh = require('ovh')({
  appKey: process.env.OVH_APP_KEY,
  appSecret: process.env.OVH_APP_SECRET,
  consumerKey: process.env.OVH_CONSUMER_KEY,
});

const config = require('./config');

const betaOVH = {
  emailInfos: async (id) => {
    const url = `/email/domain/${config.domain}/account/${id}`;

    try {
      return await ovh.requestPromised('GET', url, {});
    } catch (err) {
      if (err.error == '404') return null;
      throw new Error(`OVH Error GET on ${url} : ${JSON.stringify(err)}`);
    }
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
  requestRedirections: async (method, redirectionIds) => Promise.all(redirectionIds.map((x) => BetaGouv.requestRedirection(method, x))),
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

      return await BetaGouv.requestRedirections('GET', redirectionIds);
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

      return await BetaGouv.requestRedirections('DELETE', redirectionIds);
    } catch (err) {
      throw new Error(`OVH Error on deleting ${url} : ${JSON.stringify(err)}`);
    }
  },
  redirections: async () => {
    const url = `/email/domain/${config.domain}/redirection`;

    try {
      const redirectionIds = await ovh.requestPromised('GET', url);

      return await BetaGouv.requestRedirections('GET', redirectionIds);
    } catch (err) {
      throw new Error(`OVH Error on ${url} : ${JSON.stringify(err)}`);
    }
  },
  accounts: async () => {
    const url = `/email/domain/${config.domain}/account`;

    try {
      return await ovh.requestPromised('GET', url, {});
    } catch (err) {
      if (err.error == '404') return null;
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

const BetaGouv = {
  sendInfoToSlack: async (text) => {
    try {
      return await axios.post(config.slackWebhookURL, { text });
    } catch (err) {
      throw new Error(`Error to notify slack: ${err}`);
    }
  },
  ...betaOVH,
  usersInfos: async () => axios.get(config.usersAPI).then((x) => x.data).catch((err) => {
    throw new Error(`Error to get users infos in ${config.domain}: ${err}`);
  }),
  userInfosById: async (id) => {
    const users = await BetaGouv.usersInfos();
    return users.find((element) => element.id == id);
  },
  startupsInfos: async () => axios.get(config.startupsAPI)
    .then((x) => x.data.data) // data key
    .catch((err) => {
      throw new Error(`Error to get startups infos in ${config.domain}: ${err}`);
    }),
};

module.exports = BetaGouv;
