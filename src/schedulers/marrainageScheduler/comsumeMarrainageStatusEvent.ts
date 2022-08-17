import knex from '../../db';
import { MarrainageGroup, MarrainageGroupMember, MarrainageNewcomerEmailEvent, MarrainageOnboarderEmailEvent, MARRAINAGE_EVENT } from '../../models/marrainage';
import { IEventBus } from '../../infra/eventBus';
import { EMAIL_TYPES } from '../../modules/email';

interface MarrainageCreatedJob {
  marrainage_group_id: number
}

export async function comsumeMarrainageStatusEvent(EventBus: IEventBus) {
  console.info('Job: comsumeMarrainageStatusEvent started')

  const messageHandler = async ({ marrainage_group_id } : MarrainageCreatedJob, cb) => {
    const marrainageGroup : (Pick<MarrainageGroup, "onboarder"> & Pick<MarrainageGroupMember, "username">)[] = await knex('marrainage_groups')
      .where({ id: marrainage_group_id })
      .join('marrainage_groups_members', 'marrainage_groups.id', 'marrainage_groups_members.marrainage_group_id')

    if (marrainageGroup.length) {
      EventBus.produce(MARRAINAGE_EVENT.MARRAINAGE_SEND_ONBOARDER_EMAIL, {
        user: marrainageGroup[0].username,
        type: EMAIL_TYPES.MARRAINAGE_ONBOARDER_EMAIL
      } as MarrainageOnboarderEmailEvent)

      for (const marrainage of marrainageGroup) {
        EventBus.produce(MARRAINAGE_EVENT.MARRAINAGE_SEND_NEWCOMER_EMAIL, {
          user: marrainage.username,
          type: EMAIL_TYPES.MARRAINAGE_NEWCOMER_EMAIL
        } as MarrainageNewcomerEmailEvent) 
      }
    } else {
      console.error(`No marrainage group found for id : ${marrainage_group_id}`)
    }
    cb(); // acknowledging the message
  };
  EventBus.consume(MARRAINAGE_EVENT.MARRAINAGE_IS_DOING_EVENT, messageHandler)
  console.info('Job: comsumeMarrainageStatusEvent ended')
}
