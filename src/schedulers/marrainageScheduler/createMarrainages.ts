import config from '@/config';
import { sendOnboarderRequestEmail } from '@/modules/marrainage/eventHandlers';
import { MarrainageService1v, MarrainageServiceWithGroup } from '@/services/marrainageService';
import { createRequestForUser } from '@controllers/marrainageController';
import { DBUser } from '@models/dbUser';

export async function createMarrainages() {
  const useNewMarrainage = config.FEATURE_USE_NEW_MARRAINAGE && config.MARRAINAGE_ONBOARDER_LIST
  const MarrainageService = useNewMarrainage
  ? new MarrainageServiceWithGroup(config.MARRAINAGE_ONBOARDER_LIST, config.MARRAINAGE_GROUP_LIMIT) : new MarrainageService1v(config.senderEmail, sendOnboarderRequestEmail)

  console.log('Demarrage du cron job pour créer les marrainages');
  // before this date not every user had marrainage but we don't need to create for them now
  const userWithoutMarrainage = await MarrainageService.getUsersWithoutMarrainage()
  const createMarrainagePromises = await userWithoutMarrainage.map(async (user: DBUser) => {
    try {
      // create marrainage request
      await createRequestForUser(user.username);
    } catch (e) {
      console.error(`Impossible de créer un marrainage pour ${user.username}`)
      // marrainage may fail if no member available
      console.warn(e);
    }
  })

  return Promise.all(createMarrainagePromises)
    .then(() => console.log('Cron de création de marrainage terminé'))
    .catch(console.error);
}
