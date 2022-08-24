import ejs from 'ejs'

import { EmailOnboardingReferent, EmailProps, HtmlBuilderType, SubjectFunction } from "@/modules/email"
import * as mdtohtml from '@/lib/mdtohtml'

const TEMPLATES_BY_TYPE : Record<EmailProps['type'], string | null> = {
    MARRAINAGE_NEWCOMER_EMAIL: './src/views/templates/emails/marrainageByGroupNewcomerEmail.ejs',
    MARRAINAGE_ONBOARDER_EMAIL: './src/views/templates/emails/marrainageByGroupOnboarderEmail.ejs',
    LOGIN_EMAIL: './src/views/templates/emails/login.ejs',
    MARRAINAGE_REQUEST_EMAIL: './src/views/templates/emails/marrainageRequest.ejs',
    MARRAINAGE_ACCEPT_NEWCOMER_EMAIL: './src/views/templates/emails/marrainageAcceptNewcomer.ejs',
    MARRAINAGE_ACCEPT_ONBOARDER_EMAIL: './src/views/templates/emails/marrainageAcceptOnboarder.ejs',
    MARRAINAGE_REQUEST_FAILED: './src/views/templates/emails/marrainageRequestFailed.ejs',
    ONBOARDING_REFERENT_EMAIL: './src/views/templates/emails/onboardingReferent.ejs',
    EMAIL_CREATED_EMAIL: './src/views/templates/emails/createEmail.ejs',
    EMAIL_MATTERMOST_ACCOUNT_CREATED: './src/views/templates/emails/mattermost.ejs',
    EMAIL_PR_PENDING: `./src/views/templates/emails/pendingGithubAuthorPR.ejs`
}

const SUBJECTS_BY_TYPE : Record<EmailProps['type'], string | SubjectFunction > = {
    MARRAINAGE_REQUEST_EMAIL: 'Tu as été sélectionné·e comme marrain·e 🙌',
    LOGIN_EMAIL: 'Connexion à l\'espace membre BetaGouv',
    MARRAINAGE_NEWCOMER_EMAIL: 'Nouvelle email de parrainage',
    MARRAINAGE_ONBOARDER_EMAIL: 'Nouvelle email de parrainage pour parrain/marraine',
    MARRAINAGE_ACCEPT_NEWCOMER_EMAIL: 'Mise en contact 👋',
    MARRAINAGE_ACCEPT_ONBOARDER_EMAIL: 'Mise en contact 👋',
    MARRAINAGE_REQUEST_FAILED: `La demande de marrainage n'a pas fonctionné`,
    ONBOARDING_REFERENT_EMAIL: ({ name }: EmailOnboardingReferent['variables']) => {
        return `${name} vient de créer sa fiche Github`
    },
    EMAIL_CREATED_EMAIL: 'Bienvenue chez BetaGouv 🙂',
    EMAIL_MATTERMOST_ACCOUNT_CREATED: 'Inscription à mattermost',
    EMAIL_PR_PENDING: `PR en attente`
}

const MARKDOWN_BY_TYPE : Record<EmailProps['type'], boolean> = {
    MARRAINAGE_NEWCOMER_EMAIL: false,
    MARRAINAGE_ONBOARDER_EMAIL: false,
    LOGIN_EMAIL: false,
    MARRAINAGE_REQUEST_EMAIL: false,
    MARRAINAGE_ACCEPT_NEWCOMER_EMAIL: false,
    MARRAINAGE_ACCEPT_ONBOARDER_EMAIL: false,
    MARRAINAGE_REQUEST_FAILED: false,
    ONBOARDING_REFERENT_EMAIL: true,
    EMAIL_CREATED_EMAIL: false,
    EMAIL_MATTERMOST_ACCOUNT_CREATED: false,
    EMAIL_PR_PENDING: true
}

const htmlBuilder : HtmlBuilderType = {
    renderContentForType: async ({ type, variables }) => {
        let content = await ejs.renderFile(TEMPLATES_BY_TYPE[type], variables)
        console.log('USE RENDER HTML FROM MD', MARKDOWN_BY_TYPE[type], type)
        if (MARKDOWN_BY_TYPE[type]) {
            console.log('USE RENDER HTML FROM MD')
            content = mdtohtml.renderHtmlFromMd(content)
        }
        return content
    },
    renderFile: ejs.renderFile,
    templates: TEMPLATES_BY_TYPE,
    renderContentForTypeAsMarkdown: (params) => {
        const { type } = params;
        if(!MARKDOWN_BY_TYPE[type]) {
            throw new Error(`There is no a markdown file for ${type}`)
        }
        return htmlBuilder.renderContentForType(params)
    },
    renderSubjectForType: ({ type, variables }) => {
        let subject = ''
        if (typeof SUBJECTS_BY_TYPE[type] === 'function') {
            const buildSubject = SUBJECTS_BY_TYPE[type] as SubjectFunction
            subject = buildSubject(variables)
        } else {
            subject = SUBJECTS_BY_TYPE[type] as string
        }
        return subject
    },
    subjects: SUBJECTS_BY_TYPE
  } 

export default htmlBuilder
