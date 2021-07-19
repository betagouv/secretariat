import axios from 'axios';

import ovh0 from 'ovh';

import config from './config';

const ovh = ovh0({
  appKey: process.env.OVH_APP_KEY,
  appSecret: process.env.OVH_APP_SECRET,
  consumerKey: process.env.OVH_CONSUMER_KEY,
});

class BetaGouv {
  async sendInfoToSlack(text, channel) {
    let hookURL = config.slackWebhookURLSecretariat;
    if (channel === 'general') {
      hookURL = config.slackWebhookURLGeneral;
    }
    try {
      return await axios.post(hookURL, { text });
    } catch (err) {
      throw new Error(`Error to notify slack: ${err}`);
    }
  }

  async usersInfos() {
    return axios.get(config.usersAPI).then((response) => response.data.map((author) => {
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
    });
  }

  async userInfosById(id) {
    const users = await this.usersInfos();
    return users.find((user) => user.id === id);
  }

  async startupsInfos() {
    return axios.get(config.startupsAPI)
      .then((x) => x.data.data) // data key
      .catch((err) => {
        throw new Error(`Error to get startups infos in ${config.domain}: ${err}`);
      });
  }
}

class BetaOVH {
  async emailInfos(id) {
    const url = `/email/domain/${config.domain}/account/${id}`;

    try {
      return await ovh.requestPromised('GET', url, {});
    } catch (err) {
      if (err.error == '404') return null;
      throw new Error(`OVH Error GET on ${url} : ${JSON.stringify(err)}`);
    }
  }
  async createEmail(id, password) {
    const url = `/email/domain/${config.domain}/account`;

    try {
      console.log(`OVH POST ${url} name=${id}`);

      return await ovh.requestPromised('POST', url, {
        accountName: id,
        password
      });
    } catch (err) {
      throw new Error(`OVH Error POST on ${url} : ${JSON.stringify(err)}`);
    }
  }
  async requestRedirection(method, redirectionId) {
    return ovh.requestPromised(
      method,
      `/email/domain/${config.domain}/redirection/${redirectionId}`
    );
  }
  /* eslint arrow-body-style: "warn" */
  async requestRedirections(method, redirectionIds) {
    return Promise.all(redirectionIds.map((x) => this.requestRedirection(method, x)));
  }
  async deleteRedirection(from, to) {
    const url = `/email/domain/${config.domain}/redirection`;

    try {
      const redirectionIds = await ovh.requestPromised('GET', url, {
        from,
        to
      });

      return await this.requestRedirections('DELETE', redirectionIds);
    } catch (err) {
      throw new Error(`OVH Error on deleting ${url} : ${JSON.stringify(err)}`);
    }
  }
  async redirections() {
    const url = `/email/domain/${config.domain}/redirection`;

    try {
      const redirectionIds = await ovh.requestPromised('GET', url);

      return await this.requestRedirections('GET', redirectionIds);
    } catch (err) {
      throw new Error(`OVH Error on ${url} : ${JSON.stringify(err)}`);
    }
  }
  async changePassword(id, password) {
    const url = `/email/domain/${config.domain}/account/${id}/changePassword`;

    try {
      await ovh.requestPromised('POST', url, { password });
    } catch (err) {
      throw new Error(`OVH Error on ${url} : ${JSON.stringify(err)}`);
    }
  }
}

export {BetaGouv, BetaOVH}
// module.exports = { ...betaGouv, ...betaOVH };
