import { DBUser } from "../../models/dbUser"

export enum EMAIL_TYPES {
    MARRAINAGE_NEWCOMER_EMAIL='MARRAINAGE_NEWCOMER_EMAIL',
    MARRAINAGE_ONBOARDER_EMAIL='MARRAINAGE_ONBOARDER_EMAIL'
}

type BaseEmail = {
    subject?: string
    variables: Record<string, any>,
    toEmail: string[],
    extraParams: Record<string, string>, 
    attachments: any[]
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
    variables: Record<string, any>,
    toEmail: string[],
    extraParams: Record<string, string>, 
    attachments: any[]
}

export type SendEmail = (email: SendEmailProps) => Promise<null>
