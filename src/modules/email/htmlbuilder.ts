import ejs from 'ejs'

import { EmailProps, HtmlBuilderType } from "@/modules/email"

const TEMPLATES_BY_TYPE : Record<EmailProps['type'], string | null> = {
    MARRAINAGE_NEWCOMER_EMAIL: './src/views/templates/emails/marrainageByGroupNewcomerEmail.ejs',
    MARRAINAGE_ONBOARDER_EMAIL: './src/views/templates/emails/marrainageByGroupOnboarderEmail.ejs',
    LOGIN_EMAIL: './src/views/templates/emails/login.ejs',
    MARRAINAGE_REQUEST_EMAIL: './src/views/templates/emails/marrainageRequest.ejs',
    MARRAINAGE_ACCEPT_NEWCOMER_EMAIL: './src/views/templates/emails/marrainageAcceptNewcomer.ejs',
    MARRAINAGE_ACCEPT_ONBOARDER_EMAIL: './src/views/templates/emails/marrainageAcceptOnboarder.ejs',
    MARRAINAGE_REQUEST_FAILED: './src/views/templates/emails/marrainageRequestFailed.ejs'
}

const SUBJECTS_BY_TYPE : Record<EmailProps['type'], string | null> = {
    MARRAINAGE_REQUEST_EMAIL: 'Tu as été sélectionné·e comme marrain·e 🙌',
    LOGIN_EMAIL: 'Connexion à l\'espace membre BetaGouv',
    MARRAINAGE_NEWCOMER_EMAIL: 'Nouvelle email de parrainage',
    MARRAINAGE_ONBOARDER_EMAIL: 'Nouvelle email de parrainage pour parrain/marraine',
    MARRAINAGE_ACCEPT_NEWCOMER_EMAIL: 'Mise en contact 👋',
    MARRAINAGE_ACCEPT_ONBOARDER_EMAIL: 'Mise en contact 👋',
    MARRAINAGE_REQUEST_FAILED: `La demande de marrainage n'a pas fonctionné`,
}

const htmlBuilder : HtmlBuilderType = {
    renderContentForType: ({ type, variables }) => {
        return ejs.renderFile(TEMPLATES_BY_TYPE[type], variables)
    },
    renderFile: ejs.renderFile,
    templates: TEMPLATES_BY_TYPE,
    subjects: SUBJECTS_BY_TYPE
  } 

export default htmlBuilder
