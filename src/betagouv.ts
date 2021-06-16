// betagouv.js
// ======
import { Member } from './models/member'
import { Mission } from './models/mission'

const axios = require('axios').default;
const ovh = require('ovh')({
  appKey: process.env.OVH_APP_KEY,
  appSecret: process.env.OVH_APP_SECRET,
  consumerKey: process.env.OVH_CONSUMER_KEY,
});

const config = require('./config');

const betaGouv = {
  sendInfoToSlack: async (text, channel) => {
    let hookURL = config.slackWebhookURLSecretariat;
    if (channel === 'general') {
      hookURL = config.slackWebhookURLGeneral;
    }
    try {
      return await axios.post(hookURL, { text });
    } catch (err) {
      throw new Error(`Error to notify slack: ${err}`);
    }
  },
  usersInfos: async (): Promise<Array<Member>> => {
    try {
      let response = await axios.get(config.usersAPI)

      let members: Array<Member> = response.data.map((author) : Member => {
        console.log("response author", author);
        let start, end, employer
        let missions : Array<Mission> = [] 
        if (author.missions && author.missions.length > 0) {
          missions = author.missions.map((mission): Mission => {
            const out : Mission = {
              start: mission.start,
              end: mission.end,
              status: mission.status,
              domaine: mission.domaine,
              employer: mission.employer,
            }
            return out
          })
          const sortedStartDates = author.missions.map((x) => x.start).sort();
          const sortedEndDates = author.missions.map((x) => x.end || '').sort().reverse();
          const latestMission = author.missions.reduce((a, v) => (v.end > a.end || !v.end ? v : a));
          start = sortedStartDates[0];
          end = sortedEndDates.includes('') ? '' : sortedEndDates[0];
          employer = latestMission.status ? `${latestMission.status}/${latestMission.employer}` : latestMission.employer;
        } else {
          const emptyMissions : Mission[] = []
          missions = emptyMissions
        }
     
        const member: Member = {
          id: author.id,
          fullname: author.fullname,
          github: author.github,
          start: start,
          end: end,
          employer: employer,
          missions: missions,
        }

        return member
      })
      
      return members
    }
    catch (err) {
      throw new Error(`Error to get users infos in ${config.domain}: ${err}`);
    }
  },
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
      if (err.error == '404') return null;
      throw new Error(`OVH Error GET on ${url} : ${JSON.stringify(err)}`);
    }
  },
  getAllEmailInfos: async () => { // https://eu.api.ovh.com/console/#/email/domain/%7Bdomain%7D/account#GET
    const url = `/email/domain/${config.domain}/account/`;

    try {
      return await ovh.requestPromised('GET', url, {});
    } catch (err) {
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
  /* eslint arrow-body-style: "warn" */
  requestRedirections: async (method, redirectionIds) => Promise.all(redirectionIds.map((x) => betaOVH.requestRedirection(method, x))),
  redirectionsForId: async (query) => {
    if (!query.from && !query.to) {
      throw new Error('paramètre \'from\' ou \'to\' manquant');
    }

    const url = `/email/domain/${config.domain}/redirection`

    const options = {} as any //@TODO refactor me

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

module.exports = { ...betaGouv, ...betaOVH };
