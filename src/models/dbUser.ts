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
    NPS="NPS",
    FEMALE="female",
    MALE="male",
    NB="nb"
}

export enum LegalStatus {
    AE="AE",
    EIRL="EIRL",
    SARL="SARL",
    EURL="EURL",
    SAS="SAS",
    SASU="SASU",
    SA="SA",
    SNC="SNC"
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
}

export const genderOptions = [{
    key: 'female',
    name: "Feminin"
  },{
    key: 'male',
    name: "Masculin"
  },{
    key: 'nb',
    name: "Non-binaire"
  }, {
    key: 'nps',
    name: "Ne se prononce pas"
  }]

export const statusOptions = [
  {
    key: 'AE',
    name: 'Auto-entreprise/micro-entreprise'
  },
  {
    key: 'EIRL',
    name: 'EIRL'
  },
  {
    key: 'SARL',
    name: 'SARL'
  },
  {
    key: 'EURL',
    name: 'EURL'
  },
  {
    key: 'SAS',
    name: 'SAS'
  },
  {
    key: 'SASU',
    name: 'SASU'
  },
  {
    key: 'SA',
    name: 'SA'
  },
  {
    key: 'SNC',
    name: 'snc'
  },
  {
    key: 'contractuel',
    name: 'Contractuel-elle'
  },
  {
    key: 'fonctionnaire',
    name: 'Fonctionnaire'
  }
]