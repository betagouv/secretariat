import knex from '../../db';
import { MarrainageGroup, MarrainageGroupStatus, MARRAINAGE_EVENT } from '../../models/marrainage';
import config from '../../config';
import { IEventBus } from '../../infra/eventBus';

export async function checkMarrainageStatus(EventBus : IEventBus) {

    const marrainage_groups : MarrainageGroup[] = await knex('marrainage_groups')
    .where({
      status: MarrainageGroupStatus.PENDING,
    })
    .where('count', '>=', config.MARRAINAGE_GROUP_LIMIT)
    for(const marrainage_group of marrainage_groups) {
      await knex('marrainage_groups')
        .where({
          id: marrainage_group.id
      })
      .update({
        status: MarrainageGroupStatus.DOING
      })
      EventBus.produce(MARRAINAGE_EVENT.MARRAINAGE_IS_DOING_EVENT, { marrainage_group_id: marrainage_group.id })
    }
}