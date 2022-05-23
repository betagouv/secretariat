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
    NB="NB"
}

export enum LegalStatus {
    AE="AE",
    EIRL="EIRL",
    SARL="SARL",
    EURL="EURL",
    SAS="SAS",
    SASU="SASU",
    PORTAGE="portage",
    SA="SA",
    SNC="SNC",
    contractuel="contractuel",
    fonctionnaire="fonctionnaire"
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
    name: "Féminin"
  },{
    key: 'male',
    name: "Masculin"
  },{
    key: 'NB',
    name: "Non-binaire"
  }, {
    key: 'NSP',
    name: "Ne se prononce pas"
  }]

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
    name: 'EIRL'
  },
  {
    key: 'fonctionnaire',
    name: 'Fonctionnaire'
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
    key: 'PORTAGE',
    name: 'Portage'
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
    name: 'SNC'
  }
]
