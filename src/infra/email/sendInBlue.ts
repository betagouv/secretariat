
import { objectArrayToCSV } from '@/controllers/utils'
import { EmailProps, SendEmail, SendEmailProps, AddContactsToMailingListsProps, MAILING_LIST_TYPE, SendCampaignEmailProps, IMailingService, SendCampaignEmail, RemoveContactsFromMailingListProps, UpdateContactEmailProps, Contact } from '@modules/email'
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
    EMAIL_NEWSLETTER: 0,
    EMAIL_NEW_MEMBER_PR: 0,
    EMAIL_STARTUP_ENTER_CONSTRUCTION_PHASE: 0,
    EMAIL_STARTUP_ENTER_ACCELERATION_PHASE: 0,
    EMAIL_STARTUP_ENTER_INVESTIGATION_PHASE: 929,
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
    ONBOARDING: 333,
    TEST: 336,
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

export function createContact({ email, listIds, attributes }:{
    email: string,
    listIds: number[],
    attributes?: {
        PRENOM: string
        NOM: string
    }
}) {
    let apiInstance = new SibApiV3Sdk.ContactsApi();
    let createContact = new SibApiV3Sdk.CreateContact();
    createContact.email = email
    createContact.listIds = listIds
    createContact.attributes = attributes

    return apiInstance.createContact(createContact).then(function(data) {
        console.log('API called successfully. Returned data: ' + JSON.stringify(data));
        }, function(error) {
        console.error(`Cannot add ${email}`, email);
    });
}

async function createEmailCampaign(props) {
    const {
        subject,
        sender,
        html,
        templateId,
        listIds,
        campaignName,
        variables,
    } = props
    let apiInstance = new SibApiV3Sdk.EmailCampaignsApi();
    let emailCampaigns = new SibApiV3Sdk.CreateEmailCampaign(); 
    emailCampaigns = {
        sender: sender,
        name: campaignName,
        params: variables,
        templateId,
        htmlContent: html,
        subject,
        recipients: { listIds: listIds },
    }
    return apiInstance.createEmailCampaign(emailCampaigns).then(function(data) {
        console.log('API called successfully. Returned data: ' + JSON.stringify(data));
        return data
    }, function(error) {
        console.error(error);
    });
}

export const makeSendCampaignEmail = ({
    MAIL_SENDER,
    htmlBuilder,
} : {
    MAIL_SENDER: SendEmailFromSendinblueDeps['MAIL_SENDER'],
    htmlBuilder: SendEmailFromSendinblueDeps['htmlBuilder'],
}) : SendCampaignEmail =>  {
    return async function sendCampaignEmail(props: SendCampaignEmailProps) {
        const {
            subject,
            variables,
            htmlContent,
            campaignName,
            type,
            forceTemplate
        } = props

        let templateId: number
        let html: string
        if (htmlContent) {
            html = htmlContent
            if (!html.includes(`unsubscribe`)) {
                // unsubscribe is mandatory
                html = `${html}<a href="{{ unsubscribe }}">Click here to unsubscribe</a>`
            }
        } else {
            if (!htmlBuilder || forceTemplate) {
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
        }

        const campaign = await createEmailCampaign({
            subject,
            variables,
            sender: {
                name: "Espace Membre BetaGouv",
                email: MAIL_SENDER
            },
            html,
            templateId,
            listIds: [MAILING_LIST_ID_BY_TYPE[type]],
            campaignName
        })
        let apiInstance = new SibApiV3Sdk.EmailCampaignsApi();

        let campaignId = campaign.id;

        return apiInstance.sendEmailCampaignNow(campaignId).then(function() {
            console.log('API called successfully.');
        }, function(error) {
            console.error(error);
        });
    }
}

export async function getAllContactsFromList({ listId, opts} : {listId: number, opts?: { limit: number, offset: number }}) {
    let apiInstance = new SibApiV3Sdk.ContactsApi();
    opts = opts || {
        limit: 500,
        offset: 0
    }
    const data = await apiInstance.getContactsFromList(listId, opts).then(data => data.contacts)
    if (data.length < 500) {
        return data
    }
    const nextData = await getAllContactsFromList({ listId, opts: {
        limit: 500,
        offset: 500
    }})
    return [...data, ...nextData]
}

export async function importContactsToMailingLists({
    contacts,
    listTypes
}: AddContactsToMailingListsProps): Promise<null> {
    let apiInstance = new SibApiV3Sdk.ContactsApi();

    let requestContactImport = new SibApiV3Sdk.RequestContactImport();
    let sibContacts = contacts.map(contact => ({
        email: contact.email,
        NOM: contact.lastname,
        PRENOM: contact.firstname
    }))
    requestContactImport.fileBody = objectArrayToCSV(sibContacts)
    const listIds = listTypes.map(id => MAILING_LIST_ID_BY_TYPE[id])
    requestContactImport.listIds = listIds;
    requestContactImport.emailBlacklist = false;
    requestContactImport.smsBlacklist = false;
    requestContactImport.updateExistingContacts = true;
    requestContactImport.emptyContactsAttributes = false;

    apiInstance.importContacts(requestContactImport).then(function(data) {
        console.log('API called successfully. Returned data: ' + JSON.stringify(data));
    }, function(error) {
        console.error(error);
    });
    return
}

export async function smtpBlockedContactsEmailDelete({
    email
} : { email: string }) {
    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    console.log(`Unblocked email ${email}`)
    return apiInstance.smtpBlockedContactsEmailDelete(email).then(function() {
        console.log('API called successfully.');
    }, function(error) {
        console.error(error);
    });
}

export async function unblacklistContactEmail({
    email
} : { email: string }) : Promise<null> {
    let apiInstance = new SibApiV3Sdk.ContactsApi();

    let updateContact = new SibApiV3Sdk.UpdateContact(); 
    updateContact.emailBlacklisted = false

    return apiInstance.updateContact(email, updateContact).then(function() {
        console.log('API called successfully.');
    }, function(error) {
        console.error(error);
    });
}

export async function getAllTransacBlockedContacts({
    startDate,
    endDate,
    offset,
    senders
} : {
    startDate: Date,
    endDate: Date,
    senders: string[],
    offset: number
}) : Promise<Contact[]> {
    const limit = 100
    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    let opts = { 
        'startDate': startDate.toISOString().split('T')[0], //mandatory
        'endDate': endDate.toISOString().split('T')[0], //mandatory
        limit,  // max 100
        'offset': offset || 0, 
        senders
    };

    const data = await apiInstance.getTransacBlockedContacts(opts).then(data => {
      return data.contacts
    })
    if (data.length < limit) {
        return data
    }
    const nextData = await getAllTransacBlockedContacts({
        startDate,
        endDate,
        senders,
        offset: limit
    })
    return [...data, ...nextData]
}

export async function getAllContacts({
    offset,
} : {
    offset?: number,
    modifiedSince?: Date
}) : Promise<Contact[]> {
    const limit = 1000
    let apiInstance = new SibApiV3Sdk.ContactsApi();
    let modifiedSince = new Date()
    modifiedSince.setMonth(modifiedSince.getMonth() - 3)
    let opts = { 
        limit,  // max 100
        'offset': offset || 0,
        modifiedSince
    };


    const data = await apiInstance.getContacts(opts).then(data => {
      return data.contacts
    })
    if (data.length < limit) {
        return data
    }
    const nextData = await getAllContacts({
        offset: limit,
        modifiedSince
    })
    return [...data, ...nextData]
}

export async function updateContactEmail({ previousEmail, newEmail } : UpdateContactEmailProps) {
    let apiInstance = new SibApiV3Sdk.ContactsApi();

    let updateContact = new SibApiV3Sdk.UpdateContact(); 

    updateContact.attributes = {'EMAIL':newEmail};

    return apiInstance.updateContact(previousEmail, updateContact).then(function() {
    console.log('API called successfully.');
    }, function(error) {
    console.error(error);
    });
}

export async function removeContactsFromMailingList({
    emails,
    listType
}: RemoveContactsFromMailingListProps) {
    let apiInstance = new SibApiV3Sdk.ContactsApi();

    let listId = MAILING_LIST_ID_BY_TYPE[listType]

    let contactEmails = new SibApiV3Sdk.RemoveContactFromList(); 

    contactEmails.emails = emails;

    return apiInstance.removeContactFromList(listId, contactEmails).then(function(data) {
        console.log('API called successfully. Returned data: ' + JSON.stringify(data));
    }, function(error) {
        console.error(error);
    });
}

export async function addOrCreateContactsToMailingLists({
    contacts,
    listTypes,
}) {
    // importContactsToMailingLists to the same things but update contacts at the same time
    let apiInstance = new SibApiV3Sdk.ContactsApi();
    const emails = contacts.map(contact => contact.email)
    const listIds = listTypes.map(id => MAILING_LIST_ID_BY_TYPE[id])
    const chunkSize = 25;
    let newContacts = []
    for (const listId of listIds) {
        const contacts : { email: string }[] = await getAllContactsFromList({ listId })
        const listEmails = contacts.map(contact => contact.email)
        const concernedEmails = emails.filter(x => !listEmails.includes(x));
        for (let i = 0; i < concernedEmails.length; i += chunkSize) {
            const concernedEmailsChunk = concernedEmails.slice(i, i + chunkSize);
            let contactEmails = new SibApiV3Sdk.AddContactToList();
            contactEmails.emails = concernedEmailsChunk
            try {
                const data : { contacts : { failure: string[] }} = await apiInstance.addContactToList(listId, contactEmails)
                newContacts = [...newContacts, ...data.contacts.failure]
            } catch (error) {
                console.error('Cannot add users ${error}', concernedEmailsChunk);
            }
            // do whatever
        }
    }
    for (const newContact of newContacts) {
        try {
            const contact = contacts.find(contact => contact.email = newContact)
            await createContact({
                email: newContact,
                listIds,
                attributes: {
                    PRENOM: contact.firstname,
                    NOM: contact.lastname
                }
            })
        } catch(error) {
            console.error(`Cannot create contact ${error}`);
        }
    }
}

export async function addContactsToMailingLists({
        contacts,
        listTypes,
    }: AddContactsToMailingListsProps): Promise<null> {
    return importContactsToMailingLists({ contacts, listTypes })
}

export const makeSendEmail = ({
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
            replyTo,
            bcc,
            htmlContent,
            forceTemplate
        } = props
    
        let templateId: number
        let html: string
        if (htmlContent) {
            html = htmlContent
        } else {
            if (!htmlBuilder || forceTemplate) {
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
          bcc: bcc ? bcc.map(email => ({
            "email": email
          })) : undefined,
          params: variables,
          templateId,
          htmlContent: html,
          replyTo,
          subject: subject,
        })
    }
}


export const makeSendinblue = (deps: SendinblueDeps): IMailingService => {

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
        sendEmail: makeSendEmail({ MAIL_SENDER, htmlBuilder }),
        sendCampaignEmail: makeSendCampaignEmail({ MAIL_SENDER, htmlBuilder }),
        addContactsToMailingLists,
        removeContactsFromMailingList,
        updateContactEmail,
        unblacklistContactEmail,
        smtpBlockedContactsEmailDelete,
        getAllTransacBlockedContacts,
        getAllContacts,
        getAllContactsFromList
    }
}
