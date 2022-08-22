import config from "@config";

export function getResources(req, res) {
  res.render('resource', {
    title: 'Ressources',
    activeTab: 'resources',
    currentUserId: req.auth.id,
    errors: req.flash('error'),
    messages: req.flash('message'),
    investigationReportsIframeURL: config.investigationReportsIframeURL,
  });
}
