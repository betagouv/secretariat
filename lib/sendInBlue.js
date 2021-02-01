const SibApiV3Sdk = require('sib-api-v3-sdk');

/* eslint class-methods-use-this: ["error", { "exceptMethods": ["addContactToList"] }] */

class SendInBlue {
  constructor() {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.SENDINBLUE_API_KEY;
  }

  async addContactToList(email, userInfo, listIds) {
    try {
      const apiInstance = new SibApiV3Sdk.ContactsApi();
      const createContact = {
        email,
        attributes: {
          NOM_COMPLET: userInfo.fullname,
          ROLE: userInfo.missions.role,
          MISSION_START: userInfo.missions[0].start,
          MISSION_END: userInfo.missions[0].end,
          MISSION_STATUS: userInfo.missions[0].status,
          MISSION_EMPLOYER: userInfo.missions[0].employer,
        },
        updateEnabled: false,
        listIds,
      };
      await apiInstance.createContact(createContact);
    } catch (e) {
      throw new Error(e);
    }
  }
}

module.exports = new SendInBlue();
