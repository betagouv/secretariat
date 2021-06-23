const config = require('../config');

module.exports.getResources = function (req, res) {
  res.render('resource', {
    title: 'Ressources',
    activeTab: 'resources',
    currentUserId: req.user.id,
    errors: req.flash('error'),
    messages: req.flash('message'),
    investigationReportsIframeURL: config.investigationReportsIframeURL,
  });
};
