import config from '@/config';
import { getAllChannels, MattermostChannel } from '@/lib/mattermost';
import { getMattermostUsersWithStatus } from '@/schedulers/mattermostScheduler/removeBetaAndParnersUsersFromCommunityTeam';
import { AdminMattermostPage } from '../../views';

export async function getMattermostAdmin(req, res) {
  let users = []
  if (process.env.NODE_ENV === 'production') {
    users = await getMattermostUsersWithStatus({
      nbDays: 90
    })
  }

  const channels : MattermostChannel[] = await getAllChannels(config.mattermostTeamId) 
  try {
    const title = 'Admin Mattermost';
    return res.send(AdminMattermostPage({
      title,
      users,
      channelOptions: channels.map(channel => ({
        value: channel.name,
        label: channel.display_name
      })),
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
