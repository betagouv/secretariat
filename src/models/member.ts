import { OvhRedirection, OvhResponder } from '../betagouv';
import { Mission } from './mission';


export enum Domaine {
  ANIMATION='Animation',
  COACHING = 'Coaching',
  DEPLOIEMENT = 'Déploiement',
  DESIGN = 'Design',
  DEVELOPPEMENT = 'Développement',
  INTRAPRENARIAT = 'Intraprenariat',
  PRODUIT = 'Produit',
  AUTRE = 'Autre',
}


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
