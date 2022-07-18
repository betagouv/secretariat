export enum EmailStatusCode {
    EMAIL_ACTIVE="EMAIL_ACTIVE",
    EMAIL_SUSPENDED="EMAIL_SUSPENDED",
    EMAIL_DELETED="EMAIL_DELETED",
    EMAIL_EXPIRED="EMAIL_EXPIRED",
    EMAIL_CREATION_PENDING="EMAIL_CREATION_PENDING",
    EMAIL_RECREATION_PENDING="EMAIL_RECREATION_PENDING",
    EMAIL_UNSET="EMAIL_UNSET"
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

export interface DBUser {
    secondary_email: string;
    primary_email?: string;
    username: string;
    created_at: Date;
    primary_email_status: EmailStatusCode;
    primary_email_status_updated_at: Date;
    workplace_insee_code: string;
    tjm: number;
    gender: GenderCode;
    legal_status: LegalStatus;
    communication_email: CommunicationEmailCode;
    osm_city: string;
}

export interface DBUserDetail {
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
