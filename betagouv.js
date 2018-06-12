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
  domain: process.env.SECRETARIAT_DOMAIN || "beta.gouv.fr",
  usersAPI: process.env.USERS_API || 'https://beta.gouv.fr/api/v1.3/authors.json',
  slackWebhookURL: process.env.SLACK_WEBHOOK_URL
}

const betaOVH = {
  email_infos(name) {
    const url = '/email/domain/'+config.domain+'/account/'+name
    return ovh.requestPromised('GET', url, {})
    .catch(function (err) {
       if(err.error == "404") {
         return null
       } else {
         throw 'OVH Error GET on '+name+'  : '+JSON.stringify(err);
       }
     })
  },
  create_email(name, password) {
    const url = '/email/domain/'+config.domain+'/account'
    console.log("OVH POST "+url+ " name="+name)
    return ovh.requestPromised('POST', url, { accountName: name, password: password })
      .catch(function (err) {
        throw 'OVH Error POST on '+url+' : '+JSON.stringify(err);
     });
  },
  create_redirection(from, to, keep_local) {
    const url = '/email/domain/'+config.domain+'/redirection'
    console.log("OVH POST "+url+" from+"+from+"&to="+to)
    return ovh.requestPromised('POST', url, { from: from, to: to, localCopy: keep_local }).catch(function (err) {
      throw 'OVH Error POST on '+url+' : '+JSON.stringify(err);
    })
  },
  redirection_for_name(name) {
   return ovh.requestPromised('GET', '/email/domain/'+config.domain+'/redirection', { from: name+"@beta.gouv.fr" }).then(function (redirectionIds) {
       return Promise.map(redirectionIds, function(redirectionId) {
         return ovh.requestPromised('GET', '/email/domain/'+config.domain+'/redirection/'+redirectionId);
       })
     })
     .catch(function (err) {
        throw 'OVH Error on /email/domain/'+config.domain+'/redirection : '+JSON.stringify(err);
     });
 }
}
module.exports = {
  sendInfoToSlack(message) {
    const options = {
      method: 'POST',
      uri: config.slackWebhookURL,
      body: {
        text: message
      },
      json: true
    }
    return rp(options)
      .catch(function (err) {
        throw "Error to notify slack: " + err;
      });
  },
  email_infos: betaOVH.email_infos,
  create_email: betaOVH.create_email,
  create_redirection: betaOVH.create_redirection,
  redirection_for_name: betaOVH.redirection_for_name,
   users_infos() {
     return new Promise(function (resolve, reject) {       
       https.get(config.usersAPI, (resp) => {
         let data = '';
         resp.on('data', (chunk) => {
           data += chunk;
         });
         resp.on('end', () => {
           resolve(JSON.parse(data));
         });
       }).on("error", (err) => {
         reject("Error to get users infos in beta.gouv.fr: " + err);
       });
     })
   },
   user_infos_by_id(id) {
     return module.exports.users_infos().then(function(response) {
         const result = response.find(function(element) { 
           return element.id == id
          }); 
         return result;
       })
   }
 }