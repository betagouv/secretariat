import { Mission } from './mission';

type Domaine =
  'Animation'
  | 'Coaching'
  | 'Déploiement'
  | 'Design'
  | 'Développement'
  | 'Intraprenariat'
  | 'Produit'
  | 'Autre';

export interface Member {
  id: string,
  fullname: string,
  github: string,
  missions: Mission[],
  start: string,
  end: string,
  employer: string,
  domaine: Domaine,
}
