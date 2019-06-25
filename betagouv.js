// betagouv.js
// ======
const Promise = require("bluebird");
const https = require('https');
const rp = require('request-promise');
const ovh = require('ovh')({
  appKey: process.env.OVH_APP_KEY,
  appSecret: process.env.OVH_APP_SECRET,
  consumerKey: process.env.OVH_CONSUMER_KEY
});

const config = {
  domain: process.env.SECRETARIAT_DOMAIN || 'beta.gouv.fr',
  usersAPI:
    process.env.USERS_API || 'https://beta.gouv.fr/api/v1.6/authors.json',
  slackWebhookURL: process.env.SLACK_WEBHOOK_URL
};

const betaOVH = {
  email_infos(name) {
    const url = `/email/domain/${config.domain}/account/${name}`;
    return ovh.requestPromised('GET', url, {}).catch(err => {
      if (err.error == '404') {
        return null;
      }
      throw `OVH Error GET on ${url} : ${JSON.stringify(err)}`;
    });
  },
  create_email(name, password) {
    const url = `/email/domain/${config.domain}/account`;
    console.log(`OVH POST ${url} name=${name}`);
    return ovh
      .requestPromised('POST', url, { accountName: name, password: password })
      .catch(err => {
        throw `OVH Error POST on ${url} : ${JSON.stringify(err)}`;
      });
  },
  create_redirection(from, to, keep_local) {
    const url = `/email/domain/${config.domain}/redirection`;
    console.log(`OVH POST ${url} from+${from} &to=${to}`);
    return ovh
      .requestPromised('POST', url, {
        from: from,
        to: to,
        localCopy: keep_local
      })
      .catch(err => {
        throw `OVH Error POST on ${url} : ${JSON.stringify(err)}`;
      });
  },
  redirection_for_name(name) {
    return ovh
      .requestPromised('GET', `/email/domain/${config.domain}/redirection`, {
        from: `${name}@beta.gouv.fr`
      })
      .then(redirectionIds =>
        Promise.map(redirectionIds, redirectionId =>
          ovh.requestPromised(
            'GET',
            `/email/domain/${config.domain}/redirection/${redirectionId}`
          )
        )
      )
      .catch(err => {
        throw `OVH Error on /email/domain/${
          config.domain
        }/redirection : ${JSON.stringify(err)}`;
      });
  },
  redirection_to(name) {
    return ovh
      .requestPromised('GET', `/email/domain/${config.domain}/redirection`, {
        to: `${name}@beta.gouv.fr`
      })
      .then(redirectionIds =>
        Promise.map(redirectionIds, redirectionId =>
          ovh.requestPromised(
            'GET',
            `/email/domain/${config.domain}/redirection/${redirectionId}`
          )
        )
      )
      .catch(err => {
        throw `OVH Error on /email/domain/${
          config.domain
        }/redirection : ${JSON.stringify(err)}`;
      });
  },
  delete_redirection(from, to) {
    return ovh
      .requestPromised('GET', `/email/domain/${config.domain}/redirection`, {
        from: from,
        to: to
      })
      .then(redirectionIds =>
        Promise.map(redirectionIds, redirectionId =>
          ovh.requestPromised(
            'DELETE',
            `/email/domain/${config.domain}/redirection/${redirectionId}`
          )
        )
      )
      .catch(err => {
        throw `OVH Error on deleting /email/domain/${
          config.domain
        }/redirection : ${JSON.stringify(err)}`;
      });
  },
  redirections() {
    return ovh
      .requestPromised('GET', `/email/domain/${config.domain}/redirection`)
      .then(redirectionIds =>
        Promise.map(redirectionIds, redirectionId =>
          ovh.requestPromised(
            'GET',
            `/email/domain/${config.domain}/redirection/${redirectionId}`
          )
        )
      )
      .catch(err => {
        throw `OVH Error on /email/domain/${
          config.domain
        }/redirection : ${JSON.stringify(err)}`;
      });
  },
  accounts() {
    const url = `/email/domain/${config.domain}/account`;
    return ovh.requestPromised('GET', url, {}).catch(err => {
      if (err.error != '404') {
        throw `OVH Error GET on ${url} : ${JSON.stringify(err)}`;
      }
      return null;
    });
  }
};

const BetaGouv = {
  sendInfoToSlack(message) {
    const options = {
      method: 'POST',
      uri: config.slackWebhookURL,
      body: {
        text: message
      },
      json: true
    };
    return rp(options).catch(err => {
      throw `Error to notify slack: ${err}`;
    });
  },
  ...betaOVH,
  users_infos() {
    return new Promise((resolve, reject) =>
      // TODO: utiliser `fetch` avec header accept:application/json
      // pour ne pas avoir à gérer les chunks + JSON.parse
      https
        .get(config.usersAPI, resp => {
          let data = '';
          resp.on('data', chunk => (data += chunk));
          resp.on('end', () => resolve(JSON.parse(data)));
        })
        .on('error', err => {
          reject(`Error to get users infos in beta.gouv.fr: ${err}`);
        })
    );
  },
  user_infos_by_id(id) {
    return BetaGouv.users_infos().then(response =>
      response.find(element => element.id == id)
    );
  }
};

module.exports = BetaGouv;
