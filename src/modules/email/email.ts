import { Member } from "@models/member"
import { DBUser } from "@models/dbUser"




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
  EMAIL_PR_PENDING = 'EMAIL_PR_PENDING'
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

export type MarrainageOnboarderEmail = {
    type: EMAIL_TYPES.MARRAINAGE_ONBOARDER_EMAIL
    variables: {
        member: Member,
        newcomers: {
            fullname: string,
            email: string
        }[]
    }
}

export type MarrainageNewcomerEmail = {
    type: EMAIL_TYPES.MARRAINAGE_NEWCOMER_EMAIL,
    variables: {
        member: DBUser
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
        errorMessage: string
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

    }
}

type EmailVariants =
 | MarrainageNewcomerEmail
 | MarrainageOnboarderEmail
 | LoginEmail
 | MarrainageRequestEmail
 | MarrainageAcceptNewcomerEmail
 | MarrainageAcceptOnboarderEmail
 | MarrainageRequestFailed
 | EmailOnboardingReferent
 | EmailCreatedEmail
 | EmailMattermostAccountCreated
 | EmailPRPending

export type EmailProps = BaseEmail & EmailVariants

export type SendEmailProps = {
    subject?: string
    type: EmailProps['type']
    variables: EmailProps['variables'],
    toEmail: string[],
    extraParams?: Record<string, string>, 
    attachments?: any[],
    replyTo?: string,
}

export type SendEmail = (email: SendEmailProps) => Promise<null>
