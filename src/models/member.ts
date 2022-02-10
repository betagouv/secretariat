import { EmailStatusCode } from './dbUser';
import { Mission } from './mission';

type Domaine =
  | 'Animation'
  | 'Coaching'
  | 'Déploiement'
  | 'Design'
  | 'Développement'
  | 'Intraprenariat'
  | 'Produit'
  | 'Autre';

export interface Member {
  id: string;
  fullname: string;
  github?: string;
  email?: string;
  missions: Mission[];
  startups: string[];
  previously?: string[];
  start: string;
  end: string;
  employer: string;
  domaine: Domaine;
}

export interface PartialMember {
  id?: string;
  fullname?: string;
  github?: string;
  email?: string;
  missions?: Mission[];
  startups?: string[];
  previously?: string[];
  start?: string;
  end?: string;
  employer?: string;
  domaine?: Domaine;
}


export interface MemberWithPrimaryEmailStatus extends Member {
  primary_email_status: EmailStatusCode
}

export interface MemberWithPrimaryEmail extends Member {
  primary_email: string;
}

export interface MemberWithPrimaryEmailAndMattermostUsername extends Member {
  primary_email: string;
  mattermostUsername: string;
}

export interface MemberWithPermission {
  userInfos: Member,
  canChangeEmails: boolean
}
