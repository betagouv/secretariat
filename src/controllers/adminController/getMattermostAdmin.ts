import config from '@/config';
import { MattermostChannel } from '@/lib/mattermost';
import { getMattermostUsersWithStatus } from '@/schedulers/mattermostScheduler/removeBetaAndParnersUsersFromCommunityTeam';
import { AdminMattermostPage } from '../../views';
import { getAllChannels } from '@/infra/chat';

export function getMattermostAdmin(req, res) {
  getMattermostAdminPageData(
    req,
    res,
    (data) => {
      res.send(
        AdminMattermostPage({
          ...data,
          errors: req.flash('error'),
          messages: req.flash('message'),
          request: req,
        })
      );
    },
    (err) => {
      console.error(err);
      return res.send(
        'Erreur interne : impossible de récupérer les informations de la communauté'
      );
    }
  );
}

export function getMattermostAdminApi(req, res) {
  getMattermostAdminPageData(
    req,
    res,
    (data) => {
      res.json(data);
    },
    (err) => {
      res.json(err).status(500);
    }
  );
}

async function getMattermostAdminPageData(req, res, onSuccess, onError) {
  let users = [];

  if (process.env.NODE_ENV === 'production') {
    users = await getMattermostUsersWithStatus({
      nbDays: 90,
    });
  }

  const channels: MattermostChannel[] = await getAllChannels(
    config.mattermostTeamId
  );
  try {
    const title = 'Admin Mattermost';
    return onSuccess({
      title,
      users,
      channelOptions: channels.map((channel) => ({
        value: channel.name,
        label: channel.display_name,
      })),
      currentUserId: req.auth.id,
      activeTab: 'admin',
      isAdmin: config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
    });
  } catch (err) {
    console.log(err);
    onError(err);
  }
}
