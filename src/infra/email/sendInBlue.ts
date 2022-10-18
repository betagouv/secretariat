
import { EmailProps, SendEmail, SendEmailProps, AddContactsToMailingListsProps, AddContactsToMailingLists, MAILING_LIST_TYPE  } from '@modules/email'
import SibApiV3Sdk from 'sib-api-v3-sdk'

const TEMPLATE_ID_BY_TYPE: Record<EmailProps['type'], number> = {
    MARRAINAGE_NEWCOMER_EMAIL: 3075029,
    MARRAINAGE_ONBOARDER_EMAIL: 2047347,
    LOGIN_EMAIL: 245512,
    MARRAINAGE_REQUEST_EMAIL: 0,
    MARRAINAGE_ACCEPT_NEWCOMER_EMAIL: 0,
    MARRAINAGE_ACCEPT_ONBOARDER_EMAIL: 0,
    MARRAINAGE_REQUEST_FAILED: 0,
    ONBOARDING_REFERENT_EMAIL: 0,
    EMAIL_CREATED_EMAIL: 0,
    EMAIL_MATTERMOST_ACCOUNT_CREATED: 0,
    EMAIL_PR_PENDING: 0,
    EMAIL_ENDING_CONTRACT_2_DAYS: 0,
    EMAIL_ENDING_CONTRACT_15_DAYS: 0,
    EMAIL_ENDING_CONTRACT_30_DAYS: 0,
    EMAIL_NO_MORE_CONTRACT_1_DAY: 0,
    EMAIL_NO_MORE_CONTRACT_30_DAY: 0,
    EMAIL_USER_SHOULD_UPDATE_INFO: 0,
    EMAIL_NEWSLETTER: 0
}

type SendEmailFromSendinblueDeps = {
    SIB_APIKEY_PUBLIC?: string
    SIB_APIKEY_PRIVATE: string
    MAIL_SENDER: string,
    htmlBuilder: {
        renderFile (url: string, params: any): Promise<string>,
        templates: Record<EmailProps['type'], string>
    } | undefined
}

const MAILING_LIST_ID_BY_TYPE: Record<MAILING_LIST_TYPE, number> = {
    NEWSLETTER: 332,
    ONBOARDING: 333
} 

type SendinblueDeps = {
    SIB_APIKEY_PUBLIC?: string
    SIB_APIKEY_PRIVATE: string
    MAIL_SENDER: string,
    htmlBuilder: {
        renderFile (url: string, params: any): Promise<string>,
        templates: Record<EmailProps['type'], string>
    } | undefined
}

export function createContact({ email, listIds }:{
    email: string,
    listIds: number[]
}) {
    let apiInstance = new SibApiV3Sdk.ContactsApi();
    let createContact = new SibApiV3Sdk.CreateContact();
    createContact.email = email
    createContact.listIds = listIds

    return apiInstance.createContact(createContact).then(function(data) {
        console.log('API called successfully. Returned data: ' + JSON.stringify(data));
        }, function(error) {
        console.error(error);
    });
}

export async function addContactsToMailingLists({
        emails,
        listTypes
    }: AddContactsToMailingListsProps): Promise<null> {
    let apiInstance = new SibApiV3Sdk.ContactsApi();

    const listIds = listTypes.map(id => MAILING_LIST_ID_BY_TYPE[id])
    const chunkSize = 150;
    for (const listId in listIds) {
        for (let i = 0; i < emails.length; i += chunkSize) {
            const emailsChunk = emails.slice(i, i + chunkSize);
            let contactEmails = new SibApiV3Sdk.AddContactToList();
            contactEmails.emails = emailsChunk
            try {
                const data = await apiInstance.addContactToList(listId, contactEmails)
                console.log('API called successfully. Returned data: ' + JSON.stringify(data));
            } catch (error) {
                console.error(error);
            }
            // do whatever
        }
    }
    return
}

export const makeSendEmailFromSendinblue = ({
    MAIL_SENDER,
    htmlBuilder,
} : {
    MAIL_SENDER: SendEmailFromSendinblueDeps['MAIL_SENDER'],
    htmlBuilder: SendEmailFromSendinblueDeps['htmlBuilder'],
}) : SendEmail =>  {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()

    return async function sendEmailFromSendinblue(props: SendEmailProps): Promise<null> {
        const {
            subject,
            type,
            toEmail,
            variables = {},
            replyTo
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
          replyTo,
          subject: subject,
        })
    }
}


export const makeSendinblue = (deps: SendinblueDeps): {
    sendEmail: SendEmail,
    addContactsToMailingLists: AddContactsToMailingLists
} => {

    const { SIB_APIKEY_PRIVATE, htmlBuilder, MAIL_SENDER } = deps

    const defaultClient = SibApiV3Sdk.ApiClient.instance;

    // Configure API key authorization: api-key
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = SIB_APIKEY_PRIVATE
    // Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
    //apiKey.apiKeyPrefix['api-key'] = "Token"

    // Configure API key authorization: partner-key
    const partnerKey = defaultClient.authentications['partner-key'];
    partnerKey.apiKey = SIB_APIKEY_PRIVATE

    return {
        sendEmail: makeSendEmailFromSendinblue({ MAIL_SENDER, htmlBuilder }),
        addContactsToMailingLists
    }
}
