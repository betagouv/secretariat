import { Marrainage, MarrainageGroupStatus } from "../models/marrainage";
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

    async createMarrainage(newcomerId, onboarderId) {
        return await knex('marrainage')
        .where({ username: newcomerId })
        .increment('count', 1)
        .update({ last_onboarder: onboarderId, last_updated: knex.fn.now() });
    }
}

export class MarrainageServiceWithGroup implements MarrainageService {
    users: Member[];

    constructor(users: Member[]) {
        this.users = users
    }

    async selectRandomOnboarder(newcomerId, domaine) {
        let pendingMarrainageGroup: any = await knex('marrainage_groups').where({
            status: MarrainageGroupStatus.PENDING
        }).first()
      
        if (!pendingMarrainageGroup) {
            pendingMarrainageGroup = await knex('marrainage_groups').insert({
                status: MarrainageGroupStatus.PENDING,
                onboarder: this.users[Math.floor(Math.random() * this.users.length)]
            })
        }
        return pendingMarrainageGroup.onboarder
    }

    async createMarrainage(newcomerId, onboarderId) {
        const marrainage_group = await knex('marrainage_groups')
            .where({
                onboarderId: onboarderId,
                status: MarrainageGroupStatus.PENDING
            }).first()
        
        await knex('marrainage_groups_members')
            .insert({
                username: newcomerId,
                marrainage_group_id: marrainage_group.id
            }).first()

        const updateParams = {
            count: marrainage_group.count + 1
        }
        if (marrainage_group.count + 1 > process.env.MARRAINAGE_LIMIT) {
            updateParams['status'] = MarrainageGroupStatus.DOING
        }
        await knex('marrainage_groups')
            .where({
                id: marrainage_group.id
            })
            .update(updateParams)
    }

}
