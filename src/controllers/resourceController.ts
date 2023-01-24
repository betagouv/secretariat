import { getAllChannels } from "@/lib/mattermost";
import config from "@config";
import { formatDateToReadableFormat } from "./utils";

export async function getResources(req, res) {

  let channels = await getAllChannels(config.mattermostTeamId) 
  channels = channels.map(channel => ({
    ...channel,
    last_post_at: `le ${formatDateToReadableFormat(new Date(channel.last_post_at))}`
  }))
  res.render('resource', {
    title: 'Ressources',
    activeTab: 'resources',
    currentUserId: req.auth.id,
    channels,
    errors: req.flash('error'),
    messages: req.flash('message'),
    isAdmin: config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
    investigationReportsIframeURL: config.investigationReportsIframeURL,
  });
}
