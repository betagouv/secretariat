import { getAllChannels } from "@/lib/mattermost";
import config from "@config";

export async function getResources(req, res) {

  const channels = await getAllChannels(config.mattermostTeamId)

  res.render('resource', {
    title: 'Ressources',
    activeTab: 'resources',
    currentUserId: req.auth.id,
    channels,
    errors: req.flash('error'),
    messages: req.flash('message'),
    investigationReportsIframeURL: config.investigationReportsIframeURL,
  });
}
