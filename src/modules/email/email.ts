import { Member } from "@models/member"
import { Job } from "@/models/job"
import { StartupPhase } from "@/models/startup"

export enum EMAIL_TYPES {
    MARRAINAGE_NEWCOMER_EMAIL = 'MARRAINAGE_NEWCOMER_EMAIL',
    MARRAINAGE_ONBOARDER_EMAIL = 'MARRAINAGE_ONBOARDER_EMAIL',
    LOGIN_EMAIL = 'LOGIN_EMAIL',
    MARRAINAGE_REQUEST_EMAIL = 'MARRAINAGE_REQUEST_EMAIL',
    MARRAINAGE_ACCEPT_NEWCOMER_EMAIL = 'MARRAINAGE_ACCEPT_NEWCOMER_EMAIL',
    MARRAINAGE_ACCEPT_ONBOARDER_EMAIL = 'MARRAINAGE_ACCEPT_ONBOARDER_EMAIL',
    MARRAINAGE_REJECT_ONBOARDER_EMAIL = 'MARRAINAGE_REJECT_ONBOARDER_EMAIL',
    MARRAINAGE_REQUEST_FAILED = 'MARRAINAGE_REQUEST_FAILED',
    ONBOARDING_REFERENT_EMAIL = 'ONBOARDING_REFERENT_EMAIL',
    EMAIL_CREATED_EMAIL = "EMAIL_CREATED_EMAIL",
    EMAIL_MATTERMOST_ACCOUNT_CREATED = "EMAIL_MATTERMOST_ACCOUNT_CREATED",
    EMAIL_PR_PENDING = 'EMAIL_PR_PENDING',
    EMAIL_ENDING_CONTRACT_2_DAYS = 'EMAIL_ENDING_CONTRACT_2_DAYS',
    EMAIL_ENDING_CONTRACT_15_DAYS = 'EMAIL_ENDING_CONTRACT_15_DAYS',
    EMAIL_ENDING_CONTRACT_30_DAYS = 'EMAIL_ENDING_CONTRACT_30_DAYS',
    EMAIL_NO_MORE_CONTRACT_1_DAY = 'EMAIL_NO_MORE_CONTRACT_1_DAY',
    EMAIL_NO_MORE_CONTRACT_30_DAY = "EMAIL_NO_MORE_CONTRACT_30_DAY",
    EMAIL_USER_SHOULD_UPDATE_INFO = 'EMAIL_USER_SHOULD_UPDATE_INFO',
    EMAIL_NEWSLETTER = "EMAIL_NEWSLETTER",
    EMAIL_NEW_MEMBER_PR = "EMAIL_NEW_MEMBER_PR",
    EMAIL_STARTUP_ENTER_CONSTRUCTION_PHASE = "EMAIL_STARTUP_ENTER_CONSTRUCTION_PHASE",
    EMAIL_STARTUP_ENTER_ACCELERATION_PHASE = "EMAIL_STARTUP_ENTER_ACCELERATION_PHASE",
    EMAIL_STARTUP_ENTER_INVESTIGATION_PHASE = "EMAIL_STARTUP_ENTER_INVESTIGATION_PHASE",
    EMAIL_STARTUP_ASK_PHASE = "EMAIL_STARTUP_ASK_PHASE",
    EMAIL_FORUM_REMINDER = "EMAIL_FORUM_REMINDER",
    EMAIL_TEST = "EMAIL_TEST"
}

export type SubjectFunction = {
    (variables: EmailProps['variables']) : string
}

export type HtmlBuilderType = {
    renderFile (url: string, params: any): Promise<string>,
    templates: Record<EmailProps['type'], string>,
    subjects: Record<EmailProps['type'], string | SubjectFunction>,
    renderContentForType: (params: EmailVariants) => Promise<string>,
    renderSubjectForType: (params: EmailVariants) => string,
    renderContentForTypeAsMarkdown: (params: EmailVariants) => Promise<string>,
}

type BaseEmail = {
    subject?: string,
    variables: Record<string, any>,
    toEmail: string[],
    extraParams?: Record<string, string>, 
    attachments?: any[]
}

export type EmailMarrainageOnboarder = {
    type: EMAIL_TYPES.MARRAINAGE_ONBOARDER_EMAIL
    variables: {
        member: Member,
        newcomers: {
            fullname: string,
            email: string,
            secondary_email: string
        }[]
    }
}

export type EmailMarrainageNewcomer = {
    type: EMAIL_TYPES.MARRAINAGE_NEWCOMER_EMAIL,
    variables: {
        member: Member,
        onboarder: {
            fullname: string,
        }
    }
}

export type MarrainageRequestEmail = {
    type: EMAIL_TYPES.MARRAINAGE_REQUEST_EMAIL,
    variables: {
        newcomer: Member
        onboarder: Member,
        marrainageAcceptUrl: string,
        marrainageDeclineUrl: string,
        startup: string,
    }
}

export type LoginEmail = {
    type: EMAIL_TYPES.LOGIN_EMAIL,
    variables: {
        loginUrlWithToken: string
    }
}

export type MarrainageAcceptNewcomerEmail = {
    type: EMAIL_TYPES.MARRAINAGE_ACCEPT_NEWCOMER_EMAIL,
    variables: {
        newcomer: Member,
        onboarder: Member
    }
}

export type MarrainageAcceptOnboarderEmail = {
    type: EMAIL_TYPES.MARRAINAGE_ACCEPT_ONBOARDER_EMAIL,
    variables: {
        newcomer: Member,
        onboarder: Member
    }
}

export type MarrainageRequestFailed = {
    type: EMAIL_TYPES.MARRAINAGE_REQUEST_FAILED,
    variables: {
        errorMessage: string,
        userId: string
    }
}

export type EmailOnboardingReferent = {
    type: EMAIL_TYPES.ONBOARDING_REFERENT_EMAIL,
    variables: {
        referent: string,
        prUrl: string,
        name: string,
        isEmailBetaAsked: boolean
    }
}

export type EmailCreatedEmail = {
    type: EMAIL_TYPES.EMAIL_CREATED_EMAIL,
    variables: {
        email: string,
        secondaryEmail: string,
        secretariatUrl : string,
        mattermostInvitationLink: string,
    }
}

export type EmailMattermostAccountCreated = {
    type: EMAIL_TYPES.EMAIL_MATTERMOST_ACCOUNT_CREATED,
    variables: {
        resetPasswordLink: string
    }
}

export type EmailPRPending = {
    type: EMAIL_TYPES.EMAIL_PR_PENDING,
    variables: {
        username: string,
        pr_link: string
    }
}

export type EmailEndingContract = {
    type: EMAIL_TYPES.EMAIL_ENDING_CONTRACT_30_DAYS | EMAIL_TYPES.EMAIL_ENDING_CONTRACT_15_DAYS | EMAIL_TYPES.EMAIL_ENDING_CONTRACT_2_DAYS,
    variables: {
        user: Member,
        jobs: Job[]
    }
}

export type EmailNoMoreContract = {
    type: EMAIL_TYPES.EMAIL_NO_MORE_CONTRACT_1_DAY | EMAIL_TYPES.EMAIL_NO_MORE_CONTRACT_30_DAY,
    variables: {
        user: Member
    }
}

export type EmailUserShouldUpdateInfo = {
    type: EMAIL_TYPES.EMAIL_USER_SHOULD_UPDATE_INFO,
    variables: {
        user: Member & {
            startups: string[],
            tjm: string,
            gender: string,
            legal_status: string,
            workplace_insee_code: string,
            secondary_email: string
        },
        secretariatUrl: string
    }
}

export type EmailNewsletter = {
    type: EMAIL_TYPES.EMAIL_NEWSLETTER,
    variables: {
        body: string,
        subject: string
    }
}

export type EmailNewMemberPR = {
    type: EMAIL_TYPES.EMAIL_NEW_MEMBER_PR,
    variables: {
        prUrl: string,
        name: string,
        isEmailBetaAsked: boolean,
        startup: string
    }
}

export type EmailStartupEnterConstructionPhase = {
    type: EMAIL_TYPES.EMAIL_STARTUP_ENTER_CONSTRUCTION_PHASE,
    variables: {
        startup: string
    }
}

export type EmailStartupEnterAccelerationPhase = {
    type: EMAIL_TYPES.EMAIL_STARTUP_ENTER_ACCELERATION_PHASE,
    variables: {
        startup: string
    }
}

export type EmailStartupEnterInvestigationPhase = {
    type: EMAIL_TYPES.EMAIL_STARTUP_ENTER_INVESTIGATION_PHASE,
    variables: {
        startup: string
    }
}

export type EmailStartupAskPhase = {
    type: EMAIL_TYPES.EMAIL_STARTUP_ASK_PHASE,
    variables: {
        startup: string,
        phase: StartupPhase.PHASE_ACCELERATION | StartupPhase.PHASE_CONSTRUCTION | StartupPhase.PHASE_INVESTIGATION
    }
}

export type EmailForumReminder = {
    type: EMAIL_TYPES.EMAIL_FORUM_REMINDER,
    variables: {
        date: string,
        calendar_public_url: string,
        location: string
    }
}

export type EmailTest = {
    type: EMAIL_TYPES.EMAIL_TEST,
    variables?: {} 
}

export type EmailVariants =
 | EmailMarrainageNewcomer
 | EmailMarrainageOnboarder
 | LoginEmail
 | MarrainageRequestEmail
 | MarrainageAcceptNewcomerEmail
 | MarrainageAcceptOnboarderEmail
 | MarrainageRequestFailed
 | EmailOnboardingReferent
 | EmailCreatedEmail
 | EmailMattermostAccountCreated
 | EmailPRPending
 | EmailEndingContract
 | EmailNoMoreContract
 | EmailUserShouldUpdateInfo
 | EmailNewsletter
 | EmailNewMemberPR
 | EmailStartupEnterConstructionPhase
 | EmailStartupEnterAccelerationPhase
 | EmailStartupEnterInvestigationPhase
 | EmailStartupAskPhase
 | EmailForumReminder
 | EmailTest

export type EmailProps = BaseEmail & EmailVariants

export type SendEmailProps = {
    subject?: string,
    type: EmailProps['type'],
    variables: EmailProps['variables'],
    forceTemplate?: boolean,
    toEmail: string[],
    extraParams?: Record<string, string>, 
    attachments?: any[],
    replyTo?: string,
    headers?: Record<string, string|number>,
    bcc?: string[],
    htmlContent?: string,
}

export type SendCampaignEmailProps = {
    subject?: string,
    variables: EmailProps['variables'],
    type: EmailProps['type'],
    forceTemplate?: boolean,
    extraParams?: Record<string, string>, 
    attachments?: any[],
    replyTo?: string,
    headers?: Record<string, string|number>,
    htmlContent?: string,
    mailingListType: MAILING_LIST_TYPE,
    campaignName: string,
}

export interface Contact {
    domaine?: string,
    emailBlacklisted?: boolean,
    email: string,
    firstname?: string,
    lastname?: string
}

export interface AddContactsToMailingListsProps {
    listTypes: MAILING_LIST_TYPE[],
    contacts: Contact[]
}

export interface RemoveContactsFromMailingListProps {
    listType: MAILING_LIST_TYPE,
    emails: string[]
}

export interface UpdateContactEmailProps {
    previousEmail: string,
    newEmail: string
}

export type SendEmail = (email: SendEmailProps) => Promise<null>

export type SendCampaignEmail = (props: SendCampaignEmailProps) => Promise<null>

export type AddContactsToMailingLists = (props: AddContactsToMailingListsProps) => Promise<null>

export type UpdateContactEmail = (props: UpdateContactEmailProps) => Promise<null>

export type RemoveContactsFromMailingList = (props: RemoveContactsFromMailingListProps) => Promise<null>

export type SmtpBlockedContactsEmailDelete = (props: { email: string }) => Promise<null>

export type GetAllTransacBlockedContacts = (props: { startDate: Date, endDate: Date, offset: number, senders: string[] }) => Promise<Contact[]>

export type GetAllContacts = (props: { offset: number }) => Promise<Contact[]>

export type GetAllContactsFromList = (props: { listId: number }) => Promise<Contact[]>

export type UnblacklistContactEmail = (props: { email: string }) => Promise<void>

export interface IMailingService {
    removeContactsFromMailingList?: RemoveContactsFromMailingList
    sendEmail: SendEmail,
    addContactsToMailingLists?: AddContactsToMailingLists
    sendCampaignEmail?: SendCampaignEmail,
    updateContactEmail?: UpdateContactEmail,
    unblacklistContactEmail?: UnblacklistContactEmail,
    smtpBlockedContactsEmailDelete?: SmtpBlockedContactsEmailDelete,
    getAllTransacBlockedContacts?: GetAllTransacBlockedContacts,
    getAllContacts?: GetAllContacts,
    getAllContactsFromList?: GetAllContactsFromList
}


export enum MAILING_LIST_TYPE {
  ONBOARDING = "ONBOARDING",
  NEWSLETTER = "NEWSLETTER",
  TEST = "TEST",
  FORUM_REMINDER = "FORUM_REMINDER"
}

