import { DBUser } from "src/models/dbUser"

export enum EMAIL_TYPES {
    MARRAINAGE_NEWCOMER_EMAIL='MARRAINAGE_NEWCOMER_EMAIL',
    MARRAINAGE_ONBOARDER_EMAIL='MARRAINAGE_ONBOARDER_EMAIL'
}

type BaseEmail = {
    subject?: string
    variables: any
    toEmail: string[],
    extraParams: Record<string, string>, 
    attachments: any[]
    recipients: Array<{ email: string; name?: string }>
}

export type MarrainageOnboarderEmail = {
    type: EMAIL_TYPES.MARRAINAGE_ONBOARDER_EMAIL
    variables: {
        member: DBUser
    }
} & BaseEmail

export type MarrainageNewcomerEmail = {
    type: EMAIL_TYPES.MARRAINAGE_NEWCOMER_EMAIL,
    variables: {
        member: DBUser
    }
} & BaseEmail
   
type EmailVariants =
 | MarrainageNewcomerEmail
 | MarrainageOnboarderEmail

export type EmailProps = BaseEmail & EmailVariants

export type SendEmailProps = {
    subject?: string
    type: EmailProps['type']
    variables: Record<string, string>
    toEmail: string[],
    extraParams: Record<string, string>, 
    attachments: any[]
    recipients: Array<{ email: string; name?: string }>
}

export type SendEmail = (email: SendEmailProps) => Promise<null>
