import knex from '../../db';
import { MarrainageGroup, MarrainageGroupMember, EventEmailMarrainageOnboarder, EventEmailMarrainageNewcomer, MARRAINAGE_EVENT } from '@models/marrainage';
import { IEventBus } from '@infra/eventBus';

interface MarrainageCreatedJob {
  marrainage_group_id: number
}

export async function comsumeMarrainageStatusEvent(EventBus: IEventBus) {
  console.info('Job: comsumeMarrainageStatusEvent started')

  const messageHandler = async ({ marrainage_group_id } : MarrainageCreatedJob) => {
    console.log(`Message marrainage pour ${marrainage_group_id}`)
    const marrainageGroup : (Pick<MarrainageGroup, "onboarder"> & Pick<MarrainageGroupMember, "username">)[] = await knex('marrainage_groups')
      .where({ id: marrainage_group_id })
      .join('marrainage_groups_members', 'marrainage_groups.id', 'marrainage_groups_members.marrainage_group_id')

    if (marrainageGroup.length) {
      EventBus.produce(MARRAINAGE_EVENT.MARRAINAGE_SEND_ONBOARDER_EMAIL, {
        user: marrainageGroup[0].onboarder,
        marrainage_group_id: marrainage_group_id,
        type: MARRAINAGE_EVENT.MARRAINAGE_SEND_ONBOARDER_EMAIL
      } as EventEmailMarrainageOnboarder)
      console.info(`Event send onboarder email for ${marrainageGroup[0].onboarder} produced`)

      for (const marrainage of marrainageGroup) {
        EventBus.produce(MARRAINAGE_EVENT.MARRAINAGE_SEND_NEWCOMER_EMAIL, {
          user: marrainage.username,
          marrainage_group_id: marrainage_group_id,
          type: MARRAINAGE_EVENT.MARRAINAGE_SEND_NEWCOMER_EMAIL,
        } as EventEmailMarrainageNewcomer) 
        console.info(`Event send newcomer email for ${marrainage.username} produced`)
      }
    } else {
      console.error(`No marrainage group found for id : ${marrainage_group_id}`)
    }
  };
  EventBus.consume(MARRAINAGE_EVENT.MARRAINAGE_IS_DOING_EVENT, messageHandler)
  console.info('Job: comsumeMarrainageStatusEvent ended')
}
