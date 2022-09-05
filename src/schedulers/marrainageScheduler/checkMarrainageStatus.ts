import config from '@config';
import { MarrainageServiceWithGroup } from '@/services/marrainageService';

export async function checkMarrainageStatus() {
    console.info('Job: CheckMarrainageStatus started')
    const marrainageService = new MarrainageServiceWithGroup(
      config.MARRAINAGE_ONBOARDER_LIST,
      config.MARRAINAGE_GROUP_LIMIT)
    await marrainageService.checkAndUpdateMarrainagesStatus()
    console.info('Job: CheckMarrainageStatus ended')
}
