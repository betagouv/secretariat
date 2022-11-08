import config from '@/config';
import { getMattermostUsersWithStatus } from '@/schedulers/mattermostScheduler/removeBetaAndParnersUsersFromCommunityTeam';
import { AdminMattermostPage } from '../../views';

export async function getMattermostAdmin(req, res) {
  if (!config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id)) {
    res.send(401, 'Droit insufisant pour utiliser cette feature')
    return
  } 
  const users = await getMattermostUsersWithStatus({
    nbDays: 90
  })
  try {
    const title = 'Admin Mattermost';
    return res.send(AdminMattermostPage({
      title,
      users,
      currentUserId: req.auth.id,
      activeTab: 'community',
      errors: req.flash('error'),
      messages: req.flash('message'),
      request: req
    }));
  } catch (err) {
    console.error(err);
    return res.send('Erreur interne : impossible de récupérer les informations de la communauté');
  }
}
