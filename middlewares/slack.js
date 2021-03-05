const { slackChannel, token } = require('../config');

function verification(req, res, next) {
  if (token === req.body.token && slackChannel === req.body.channel_name) {
    next();
  } else {
    res
      .send({
        text:
          `Veuillez effectuer cette commande dans le channel ${slackChannel}`,
        mrkdwn: true,
        response_type: 'ephemeral',
      })
      .status(401);
  }
}

module.exports = verification;
