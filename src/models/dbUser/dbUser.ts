export enum USER_EVENT {
    USER_EMAIL_ACTIVATED = 'USER_EMAIL_ACTIVATED',
    ADD_USER_TO_ONBOARDING_MAILING_LIST = "ADD_USER_TO_ONBOARDING_MAILING_LIST",
    USER_EMAIL_REDIRECTION_ACTIVATED = "USER_EMAIL_REDIRECTION_ACTIVATED"
}

export enum EmailStatusCode {
    EMAIL_ACTIVE = "EMAIL_ACTIVE",
    EMAIL_SUSPENDED = "EMAIL_SUSPENDED",
    EMAIL_DELETED = "EMAIL_DELETED",
    EMAIL_EXPIRED = "EMAIL_EXPIRED",
    EMAIL_CREATION_PENDING = "EMAIL_CREATION_PENDING",
    EMAIL_RECREATION_PENDING = "EMAIL_RECREATION_PENDING",
    EMAIL_UNSET = "EMAIL_UNSET",
    EMAIL_REDIRECTION_PENDING = "EMAIL_REDIRECTION_PENDING",
    EMAIL_REDIRECTION_ACTIVE = "EMAIL_REDIRECTION_ACTIVE"
}

export enum GenderCode {
    NSP="NSP",
    FEMALE="female",
    MALE="male",
    OTHER="other"
}

export enum LegalStatus {
    AE="AE",
    contractuel="contractuel",
    EIRL="EIRL",
    EURL="EURL",
    fonctionnaire="fonctionnaire",
    PORTAGE="portage",
    asso="asso",
    SA="sa",
    SASU="SASU",
    SNC="SNC",
}

export enum CommunicationEmailCode {
  PRIMARY="primary",
  SECONDARY="secondary"
}

export enum MemberType {
  BETA='beta',
  ATTRIBUTAIRE='attributaire',
  DINUM='dinum',
  OTHER='autre'
}

export interface DBUser {
    secondary_email: string;
    primary_email?: string;
    username: string;
    member_type: MemberType;
    created_at: Date;
    primary_email_status: EmailStatusCode;
    primary_email_status_updated_at: Date;
    workplace_insee_code: string;
    tjm: number;
    gender: GenderCode;
    legal_status: LegalStatus;
    communication_email: CommunicationEmailCode;
    osm_city: string;
    average_nb_of_days: number;
    startups: string[];
    email_is_redirection: boolean;
}

export interface DBUserDetail {
  average_nb_of_days: number;
  hash: string;
  tjm: number;
  gender: GenderCode;
}

export const genderOptions = [{
    key: 'female',
    name: "Féminin"
  },{
    key: 'male',
    name: "Masculin"
  },{
    key: 'other',
    name: "Autre"
  }, {
    key: 'NSP',
    name: "Ne se prononce pas"
  }]

export const statusOptions = [
  {
    key: 'AE',
    name: 'Auto-entreprise/micro-entreprise'
  },
  {
    key: 'contractuel',
    name: 'Contractuel-elle'
  },
  {
    key: 'EIRL',
    name: 'Entreprise individuelle : EI ou EIRL'
  },
  {
    key: 'EURL',
    name: 'EURL'
  },
  {
    key: 'fonctionnaire',
    name: 'Fonctionnaire'
  },
  {
    key: 'PORTAGE',
    name: 'Portage salarial'
  },
  {
    key: 'asso',
    name: "Salarié-e d'une coopérative (CAE, SCOP, Association)"
  },
  {
    key: 'SA',
    name: "Salarié-e d'une entreprise (SA, SAS, SARL)"
  },
  {
    key: 'SASU',
    name: 'SASU'
  },
  {
    key: 'SNC',
    name: 'SNC'
  }
]
