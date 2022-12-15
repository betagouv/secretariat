import ejs from 'ejs'

import { EmailOnboardingReferent, EmailNewsletter, EmailProps, HtmlBuilderType, SubjectFunction, EmailNewMemberPR, EmailStartupEnterConstructionPhase, EmailStartupEnterAccelerationPhase } from "@/modules/email"
import * as mdtohtml from '@/lib/mdtohtml'

const TEMPLATES_BY_TYPE : Record<EmailProps['type'], string | null> = {
    MARRAINAGE_NEWCOMER_EMAIL: './src/views/templates/emails/marrainage/marrainageByGroupNewcomerEmail.ejs',
    MARRAINAGE_ONBOARDER_EMAIL: './src/views/templates/emails/marrainage/marrainageByGroupOnboarderEmail.ejs',
    LOGIN_EMAIL: './src/views/templates/emails/login.ejs',
    MARRAINAGE_REQUEST_EMAIL: './src/views/templates/emails/marrainage/marrainageRequest.ejs',
    MARRAINAGE_ACCEPT_NEWCOMER_EMAIL: './src/views/templates/emails/marrainage/marrainageAcceptNewcomer.ejs',
    MARRAINAGE_ACCEPT_ONBOARDER_EMAIL: './src/views/templates/emails/marrainage/marrainageAcceptOnboarder.ejs',
    MARRAINAGE_REQUEST_FAILED: './src/views/templates/emails/marrainage/marrainageRequestFailed.ejs',
    ONBOARDING_REFERENT_EMAIL: './src/views/templates/emails/onboardingReferent.ejs',
    EMAIL_CREATED_EMAIL: './src/views/templates/emails/createEmail.ejs',
    EMAIL_MATTERMOST_ACCOUNT_CREATED: './src/views/templates/emails/mattermost.ejs',
    EMAIL_PR_PENDING: `./src/views/templates/emails/pendingGithubAuthorPR.ejs`,
    EMAIL_ENDING_CONTRACT_2_DAYS: './src/views/templates/emails/mail2days.ejs',
    EMAIL_ENDING_CONTRACT_15_DAYS: './src/views/templates/emails/mail15days.ejs',
    EMAIL_ENDING_CONTRACT_30_DAYS: './src/views/templates/emails/mail30days.ejs',
    EMAIL_NO_MORE_CONTRACT_1_DAY: './src/views/templates/emails/mailExpired1day.ejs',
    EMAIL_NO_MORE_CONTRACT_30_DAY: './src/views/templates/emails/mailExpired30days.ejs',
    EMAIL_USER_SHOULD_UPDATE_INFO: `./src/views/templates/emails/updateUserInfoEmail.ejs`,
    EMAIL_NEWSLETTER: './src/views/templates/emails/newsletter.ejs',
    EMAIL_NEW_MEMBER_PR: './src/views/templates/emails/newMemberPR.ejs',
    EMAIL_STARTUP_ENTER_CONSTRUCTION_PHASE: './src/views/templates/emails/startupEnterConstructionPhase.ejs',
    EMAIL_STARTUP_ENTER_ACCELERATION_PHASE: './src/views/templates/emails/startupEnterAccelerationPhase.ejs',
    EMAIL_STARTUP_ENTER_INVESTIGATION_PHASE: null
}

const SUBJECTS_BY_TYPE : Record<EmailProps['type'], string | SubjectFunction > = {
    MARRAINAGE_REQUEST_EMAIL: 'Tu as été sélectionné·e comme marrain·e 🙌',
    LOGIN_EMAIL: 'Connexion à l\'espace membre BetaGouv',
    MARRAINAGE_NEWCOMER_EMAIL: 'Découvre ta marraine ou ton parrain Beta !',
    MARRAINAGE_ONBOARDER_EMAIL: 'Découvre tes filleuls Beta !',
    MARRAINAGE_ACCEPT_NEWCOMER_EMAIL: 'Mise en contact 👋',
    MARRAINAGE_ACCEPT_ONBOARDER_EMAIL: 'Mise en contact 👋',
    MARRAINAGE_REQUEST_FAILED: `La demande de marrainage n'a pas fonctionné`,
    ONBOARDING_REFERENT_EMAIL: ({ name }: EmailOnboardingReferent['variables']) => {
        return `${name} vient de créer sa fiche Github`
    },
    EMAIL_CREATED_EMAIL: 'Bienvenue chez BetaGouv 🙂',
    EMAIL_MATTERMOST_ACCOUNT_CREATED: 'Inscription à mattermost',
    EMAIL_PR_PENDING: `PR en attente`,
    EMAIL_ENDING_CONTRACT_2_DAYS: 'Départ dans 2 jours 🙂',
    EMAIL_ENDING_CONTRACT_15_DAYS: 'Départ dans 15 jours 🙂',
    EMAIL_ENDING_CONTRACT_30_DAYS: 'Départ dans 30 jours 🙂',
    EMAIL_NO_MORE_CONTRACT_1_DAY: 'A bientôt 🙂',
    EMAIL_NO_MORE_CONTRACT_30_DAY: 'A bientôt 🙂',
    EMAIL_USER_SHOULD_UPDATE_INFO: 'Mise à jour de tes informations',
    EMAIL_NEWSLETTER: ({ subject }: EmailNewsletter['variables']) => {
        return `${subject}`
    },
    EMAIL_NEW_MEMBER_PR: ({ name }: EmailNewMemberPR['variables']) => {
        return `${name} vient de créer sa fiche Github`
    },
    EMAIL_STARTUP_ENTER_CONSTRUCTION_PHASE: ({ startup }: EmailStartupEnterConstructionPhase['variables']) => {
        return `${startup} passe en construction : les bonnes pratiques`
    },
    EMAIL_STARTUP_ENTER_ACCELERATION_PHASE: ({ startup }: EmailStartupEnterAccelerationPhase['variables']) => {
        return `${startup} passe en acceleration : les bonnes pratiques`
    },
    EMAIL_STARTUP_ENTER_INVESTIGATION_PHASE: ''
}

const MARKDOWN_BY_TYPE : Record<EmailProps['type'], boolean> = {
    MARRAINAGE_NEWCOMER_EMAIL: true,
    MARRAINAGE_ONBOARDER_EMAIL: true,
    LOGIN_EMAIL: false,
    MARRAINAGE_REQUEST_EMAIL: false,
    MARRAINAGE_ACCEPT_NEWCOMER_EMAIL: false,
    MARRAINAGE_ACCEPT_ONBOARDER_EMAIL: false,
    MARRAINAGE_REQUEST_FAILED: false,
    ONBOARDING_REFERENT_EMAIL: true,
    EMAIL_CREATED_EMAIL: false,
    EMAIL_MATTERMOST_ACCOUNT_CREATED: false,
    EMAIL_PR_PENDING: true,
    EMAIL_ENDING_CONTRACT_2_DAYS: true,
    EMAIL_ENDING_CONTRACT_15_DAYS: true,
    EMAIL_ENDING_CONTRACT_30_DAYS: true,
    EMAIL_NO_MORE_CONTRACT_1_DAY: false,
    EMAIL_NO_MORE_CONTRACT_30_DAY: false,
    EMAIL_USER_SHOULD_UPDATE_INFO: true,
    EMAIL_NEWSLETTER: true,
    EMAIL_NEW_MEMBER_PR: true,
    EMAIL_STARTUP_ENTER_CONSTRUCTION_PHASE: true,
    EMAIL_STARTUP_ENTER_ACCELERATION_PHASE: true,
    EMAIL_STARTUP_ENTER_INVESTIGATION_PHASE: false
}

const htmlBuilder : HtmlBuilderType = {
    renderContentForType: async ({ type, variables }) => {
        let content = await ejs.renderFile(TEMPLATES_BY_TYPE[type], variables)
        if (MARKDOWN_BY_TYPE[type]) {
            content = mdtohtml.renderHtmlFromMd(content)
        }
        return content
    },
    renderFile: ejs.renderFile,
    templates: TEMPLATES_BY_TYPE,
    renderContentForTypeAsMarkdown: async (params) => {
        const { type, variables } = params;
        if(!MARKDOWN_BY_TYPE[type]) {
            throw new Error(`There is no markdown file for ${type}`)
        }
        let content = await ejs.renderFile(TEMPLATES_BY_TYPE[type], variables)
        return content
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
