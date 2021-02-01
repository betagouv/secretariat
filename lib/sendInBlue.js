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
          NOM_COMPLET: userInfo.username,
          ROLE: userInfo.mission.role,
          MISSION_START: userInfo.mission.start,
          MISSION_END: userInfo.mission.end,
          MISSION_STATUS: userInfo.mission.status,
          MISSION_EMPLOYER: userInfo.mission.employer,
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
