import _ from 'lodash/array';
import betagouv from "@/betagouv";
import EventBus from "@/infra/eventBus/eventBus";
import { DBUser, EmailStatusCode } from "@/models/dbUser";
import { MarrainageGroupStatus, MarrainageGroup, MARRAINAGE_EVENT } from "@/models/marrainage";
import { Member } from "@/models/member";
import knex from "@/db";
import { MarrainageService } from ".";

const countNumberOfMarrainage = (onboarders) => {
    const count = {};
    for (const  onboarder of onboarders) {
        if (count[ onboarder]) {
          count[ onboarder] += 1;
        } else {
          count[onboarder] = 0;
        }
    }
    return onboarders.map(onboarder => {
        return {
            onboarder,
            count: count[onboarder]
        }
    })
}

const sortAscending = function(a, b){return a.count-b.count}

export class MarrainageServiceWithGroup implements MarrainageService {
    users: string[];
    MARRAINAGE_GROUP_LIMIT: number;
    MARRAINAGE_GROUP_WEEK_LIMIT: number;

    constructor(
        users: string[],
        marrainage_group_limit: number,
        marrainage_group_week_limit?: number) {
        console.log('Marrainage service with group initiated')
        this.users = users
        this.MARRAINAGE_GROUP_LIMIT = marrainage_group_limit || 5
        this.MARRAINAGE_GROUP_WEEK_LIMIT = marrainage_group_week_limit || 2
    }

    async selectRandomOnboarder() : Promise<Member> {
        let pendingMarrainageGroup: MarrainageGroup = await knex('marrainage_groups').where({
            status: MarrainageGroupStatus.PENDING
        }).first()
        let onboarder : Member
        if (pendingMarrainageGroup) {
            onboarder = await betagouv.userInfosById(pendingMarrainageGroup.onboarder)
        } else {
            const marrainageGroups : MarrainageGroup[] = await knex('marrainage_groups').whereNotIn('status', [
                MarrainageGroupStatus.DOING,
                MarrainageGroupStatus.DONE,
            ])
            const onboarders = marrainageGroups.map(marrainageGroup => marrainageGroup.onboarder)
            const userInfos : Member[] = await betagouv.usersInfos()
            const users : Member[] = this.users.map(id => userInfos.find(user => user.id === id))
            // we take the onboarder with less marrainages
            const sortedOnboarder = countNumberOfMarrainage([...onboarders, ...users]).sort(sortAscending)
            console.log('-- ONBOARDER LIST --', sortedOnboarder)
            onboarder = sortedOnboarder[0].onboarder
        }
        return onboarder
    }

    async createMarrainage(newcomerId) : Promise<Member> {
        const onboarder : Member = await this.selectRandomOnboarder()
        const onboarderId = onboarder.id
        await knex.transaction(async (trx) => {
            let marrainage_group = await trx('marrainage_groups')
                .where({
                    onboarder: onboarderId,
                    status: MarrainageGroupStatus.PENDING
                })
                .where('count', '<', this.MARRAINAGE_GROUP_LIMIT).first()
            
            if (!marrainage_group) {
                marrainage_group = await trx('marrainage_groups')
                .insert({
                    onboarder: onboarderId,
                    status: MarrainageGroupStatus.PENDING
                }).returning('*').then(res => res[0])
            }
            await trx('marrainage_groups_members')
                .insert({
                    username: newcomerId,
                    marrainage_group_id: marrainage_group.id
                })

            const updateParams = {
                count: marrainage_group.count + 1
            }
            await trx('marrainage_groups')
                .where({
                    id: marrainage_group.id
                })
                .update(updateParams)
        })
        return onboarder
    }

    async _setMarrainageToDoing(marrainage_group_id) {
        await knex('marrainage_groups')
            .where({
            id: marrainage_group_id
        })
        .update({
            status: MarrainageGroupStatus.DOING
        })
        console.info(`MarrainageGroup ${marrainage_group_id} status set to DOING`)
        EventBus.produce(MARRAINAGE_EVENT.MARRAINAGE_IS_DOING_EVENT, { marrainage_group_id: marrainage_group_id })
    }

    async checkAndUpdateMarrainagesStatus() {
        const todayLessXdays = new Date()
        todayLessXdays.setDate(todayLessXdays.getDate() - (this.MARRAINAGE_GROUP_WEEK_LIMIT * 7))
        const marrainage_groups : MarrainageGroup[] = await knex('marrainage_groups')
        .where({
          status: MarrainageGroupStatus.PENDING,
        })
        .where('count', '>=', this.MARRAINAGE_GROUP_LIMIT)
        .orWhere('created_at', '<=', todayLessXdays)
        for(const marrainage_group of marrainage_groups) {
          await this._setMarrainageToDoing(marrainage_group.id)
        }
    }

    async getUsersWithoutMarrainage(): Promise<DBUser[]> {
        const dateFeatureAdded = new Date('01/23/2022');
        const users : DBUser[] = await knex('users').where({
          primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
        }).andWhere('created_at', '>', dateFeatureAdded)
        const marrainages = await knex('marrainage_groups_members').whereIn('username', users.map(user => user.username))
        const oldMarrainages = await knex('marrainage').whereIn('username', users.map(user => user.username))

        return _.differenceWith(users, [...marrainages, ...oldMarrainages], (user, marrainage) => user.username === marrainage.username)
    }

}
