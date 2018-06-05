// betagouv.js
// ======
const Promise = require("bluebird");
const https = require('https');
const ovh = require('ovh')({
    appKey: process.env.OVH_APP_KEY,
    appSecret: process.env.OVH_APP_SECRET,
    consumerKey: process.env.OVH_CONSUMER_KEY
  });

module.exports = {
    // /email/domain/{domain}/redirection
    email_infos(name) {
      return new Promise(function (resolve, reject) { 
        ovh.requestPromised('GET', '/email/domain/beta.gouv.fr/account/'+name, {}).then(function(response) {
         resolve(response);
       }).catch(function (err) {
         if(err.error == "404") {
           resolve(null)
         } else {
           reject('OVH Error on /email/domain/beta.gouv.fr/redirection/:id : '+JSON.stringify(err));
         }
       })
      });
    },
    redirection_for_name(name) {
     return new Promise(function (resolve, reject) {
       ovh.requestPromised('GET', '/email/domain/beta.gouv.fr/redirection', { from: name+"@beta.gouv.fr" }).then(function (redirectionIds) {
         Promise.map(redirectionIds, function(redirectionId) {
           return ovh.requestPromised('GET', '/email/domain/beta.gouv.fr/redirection/'+redirectionId);
         }).then(function(responses) {
            resolve(responses);
         }).catch(function (err) {
            reject('OVH Error on /email/domain/beta.gouv.fr/redirection/:id : '+JSON.stringify(err));
         });
       })
       .catch(function (err) {
         reject('OVH Error on /email/domain/beta.gouv.fr/redirection : '+JSON.stringify(err));
       });
     });
   },
   users_infos() {
     return new Promise(function (resolve, reject) {       
       https.get('https://beta.gouv.fr/api/v1.3/authors.json', (resp) => {
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
     return new Promise(function (resolve, reject) { 
        module.exports.users_infos().then(function(response) {
         const result = response.find(function(element) { 
           return element.id == id
          }); 
         resolve(result);
       }).catch(function (err) {
         reject(err);
        });
     })
   }
 }