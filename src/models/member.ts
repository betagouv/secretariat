import { EmailStatusCode } from './dbUser';
import { Mission } from './mission';
import { OvhRedirection, OvhResponder } from './ovh';

export enum Domaine {
  ANIMATION = 'Animation',
  COACHING = 'Coaching',
  DEPLOIEMENT = 'Déploiement',
  DESIGN = 'Design',
  DEVELOPPEMENT = 'Développement',
  INTRAPRENARIAT = 'Intraprenariat',
  PRODUIT = 'Produit',
  AUTRE = 'Autre',
}

export const DOMAINE_OPTIONS = [
  {
    key: 'ANIMATION',
    name: 'Animation',
  },
  {
    key: 'COACHING',
    name: 'Coaching',
  },
  {
    key: 'DEPLOIEMENT',
    name: 'Déploiement',
  },
  {
    key: 'DESIGN',
    name: 'Design',
  },
  {
    key: 'DEVELOPPEMENT',
    name: 'Développement',
  },
  {
    key: 'INTRAPRENARIAT',
    name: 'Intraprenariat',
  },
  {
    key: 'PRODUIT',
    name: 'Produit',
  },
  {
    key: 'AUTRE',
    name: 'Autre',
  },
];

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
  role: string;
}

export interface MemberWithPrimaryEmailInfo extends Member {
  primary_email: string;
  primary_email_status: EmailStatusCode;
  primary_email_status_updated_at: Date;
}

export interface MemberWithEmail extends Member {
  email: string | undefined;
}

export interface MemberWithEmailsAndMattermostUsername extends Member {
  primary_email: string;
  secondary_email?: string;
  communication_email: string;
  mattermostUsername: string;
}

export interface MemberWithPermission {
  userInfos: Member;
  emailInfos: any;
  redirections: OvhRedirection[];
  canChangeEmails: boolean;
  isExpired: boolean;
  responder: OvhResponder;
  canCreateEmail;
  canCreateRedirection;
  canChangePassword;
}
