import { Marrainage } from "../models/marrainage";
import { Domaine, Member } from '../models/member';
import BetaGouv from '../betagouv';
import * as utils from '../controllers/utils';
import knex from '../db';

interface MarrainageService {
    selectRandomOnboarder(newcomerId: string, domaine: string): Promise<Member>
}

export class MarrainageService1v implements MarrainageService {
    async selectRandomOnboarder(newcomerId: string, domaine: string) {
            const users: Member[] = await BetaGouv.usersInfos();
        const minimumSeniority = new Date().setMonth(new Date().getMonth() - 6);
        const existingCandidates: string[] = await knex('marrainage')
            .select('last_onboarder')
            .where({ completed: false })
            .distinct()
            .then((marrainages: Marrainage[]) => marrainages.map((x) => x.last_onboarder));

        const onboarders = users.filter((x) => {
            const existingCandidate = existingCandidates.includes(x.id);
            const senior = new Date(minimumSeniority) > new Date(x.start);
            const stillActive = !utils.checkUserIsExpired(x);
            const isRequester = x.id === newcomerId;
            return !existingCandidate && senior && stillActive && !isRequester;
        });
        const onboardersFromDomaine = onboarders.filter(onboarder => onboarder.domaine === domaine)
        const onboarderPool = (domaine === Domaine.AUTRE || !onboardersFromDomaine.length) ? onboarders : onboardersFromDomaine
        return onboarderPool[Math.floor(Math.random() * onboarderPool.length)];
    }
}

export class MarrainageService2v implements MarrainageService {
    users: Member[];

    constructor(users: Member[]) {
        this.users = users
    }

    async selectRandomOnboarder(newcomerId, domaine) {
        const existingCandidates: string[] = await knex('marrainage')
          .select('last_onboarder')
          .where({ completed: false })
          .distinct()
          .then((marrainages: Marrainage[]) => marrainages.map((x) => x.last_onboarder));
      
        const onboarders = this.users.filter((x) => {
          const existingCandidate = existingCandidates.includes(x.id);
          const isRequester = x.id === newcomerId;
          return !existingCandidate && !isRequester;
        });
        const onboardersFromDomaine = onboarders.filter(onboarder => onboarder.domaine === domaine)
        const onboarderPool = (domaine === Domaine.AUTRE || !onboardersFromDomaine.length) ? onboarders : onboardersFromDomaine
        return onboarderPool[Math.floor(Math.random() * onboarderPool.length)];
      }
}
