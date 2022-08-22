
import SibApiV3Sdk from 'sib-api-v3-sdk'

import { EmailProps, SendEmail, SendEmailProps } from '@modules/email';

const TEMPLATE_ID_BY_TYPE: Record<EmailProps['type'], number> = {
    'MARRAINAGE_NEWCOMER_EMAIL': 3075029,
    'MARRAINAGE_ONBOARDER_EMAIL': 2047347,
    'LOGIN_EMAIL': 245512
}

interface SendEmailFromSendinblueDeps {
    SIB_APIKEY_PUBLIC?: string
    SIB_APIKEY_PRIVATE: string
    MAIL_SENDER: string,
    htmlBuilder: {
        renderFile (url: string, params: any): Promise<string>,
        templates: Record<EmailProps['type'], string>
    } | undefined
}

// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//partnerKey.apiKeyPrefix['partner-key'] = "Token"

var api = new SibApiV3Sdk.AccountApi()
api.getAccount().then(function(data) {
  console.log('API called successfully. Returned data: ' + data);
}, function(error) {
  console.error(error);
});

export const makeSendEmailFromSendinblue = (deps: SendEmailFromSendinblueDeps): SendEmail => {

    const { SIB_APIKEY_PRIVATE, MAIL_SENDER, htmlBuilder } = deps

    var SibApiV3Sdk = require('sib-api-v3-sdk');

    var defaultClient = SibApiV3Sdk.ApiClient.instance;

    // Configure API key authorization: api-key
    var apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = SIB_APIKEY_PRIVATE
    // Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
    //apiKey.apiKeyPrefix['api-key'] = "Token"

    // Configure API key authorization: partner-key
    var partnerKey = defaultClient.authentications['partner-key'];
    partnerKey.apiKey = SIB_APIKEY_PRIVATE

    var apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  return async function sendEmailFromSendinblue(props: SendEmailProps): Promise<null> {
    const {
        subject,
        type,
        toEmail,
        variables = {},
    } = props

    let templateId: number
    let html: string
    if (!htmlBuilder) {
        templateId = TEMPLATE_ID_BY_TYPE[type]
        if (!templateId) {
            return Promise.reject(new Error('Cannot find template for type ' + type))
        }
    } else {
        const templateURL = htmlBuilder.templates[type]
        html = await htmlBuilder.renderFile(templateURL, {
          ...variables
        });
    }

    return apiInstance.sendTransacEmail({
      sender: {
          name: "Espace Membre BetaGouv",
          email: MAIL_SENDER
      },
      to: toEmail.map(email => (
          {  
             "email": email,
          }
      )),
      params: variables,
      templateId,
      htmlContent: html,
      subject: subject,
    })
  }
}
