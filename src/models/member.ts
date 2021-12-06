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
  github: string;
  email: string;
  missions: Mission[];
  startups: string[];
  previously: string[];
  start: string;
  end: string;
  employer: string;
  domaine: Domaine;
  mattermostUsername?: string;
}

export interface MemberWithPrimaryEmail extends Member {
  primary_email: string;
}

export interface UserInfos {
  userInfos: Member,
  canChangeEmails: boolean
}