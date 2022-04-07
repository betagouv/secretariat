import { OvhRedirection, OvhResponder } from '../betagouv';
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

export interface MemberWithPrimaryEmail extends Member {
  primary_email: string;
}

export interface MemberWithPrimaryEmailAndMattermostUsername extends Member {
  primary_email: string;
  mattermostUsername: string;
}

export interface MemberWithPermission {
  userInfos: Member,
  emailInfos: any,
  redirections: OvhRedirection[],
  canChangeEmails: boolean,
  isExpired: boolean,
  responder: OvhResponder,
  canCreateEmail,
  canCreateRedirection,
  canChangePassword
}
