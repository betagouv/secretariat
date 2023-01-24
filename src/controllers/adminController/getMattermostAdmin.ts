import config from '@/config';
import { getMattermostUsersWithStatus } from '@/schedulers/mattermostScheduler/removeBetaAndParnersUsersFromCommunityTeam';
import { AdminMattermostPage } from '../../views';

export async function getMattermostAdmin(req, res) {
  let users = []
  if (process.env.NODE_ENV === 'production') {
    users = await getMattermostUsersWithStatus({
      nbDays: 90
    })
  }
  try {
    const title = 'Admin Mattermost';
    return res.send(AdminMattermostPage({
      title,
      users,
      currentUserId: req.auth.id,
      activeTab: 'admin',
      isAdmin: config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
      errors: req.flash('error'),
      messages: req.flash('message'),
      request: req
    }));
  } catch (err) {
    console.error(err);
    return res.send('Erreur interne : impossible de récupérer les informations de la communauté');
  }
}
