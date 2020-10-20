const { buildBetaEmail, sendMail } = require('./utils');
const signature = require('../lib/signature');
const { extractEndDates, fetchDetails } = require('../lib/github');

module.exports.processNotification = async function (req, res) {
  if (!await signature.checkSignaturePresence(req)) {
    return res.json({
      status: 'Missing signature. Aborting…',
    });
  }

  req.signatureSecret = process.env.GITHUB_WEBHOOK_SHARED_SECRET;
  if (!await signature.checkSignatureValidity(req)) {
    return res.json({
      status: 'Incorrect signature. Aborting…',
    });
  }

  req.body = JSON.parse(req.body);
  if (req.body.ref !== 'refs/heads/master') {
    return res.json({
      status: `Ignoring branch ${req.body.ref}…`,
    });
  }

  const details = await fetchDetails(req.body);
  const emailData = details.reduce((result, item) => {
    const dates = extractEndDates(item);
    if (dates.before < dates.after) {
      const formatDate = (d) => d.toISOString().slice(0, 10);
      const msg = `Le badge de ${item.after.attributes.fullname} est aujourd'hui valable jusqu'au ${formatDate(dates.before)}. Il doit être prolongé jusqu'au ${formatDate(dates.after)}.`;

      const filename = item.data.path;
      const id = filename.slice(0, filename.length - 3);
      result.to.push(buildBetaEmail(id));
      result.messages.push(msg);
    }

    return result;
  }, {
    to: [],
    messages: [],
  });

  if (emailData.messages.length) {
    emailData.to.push('badges@incubateur.net');

    if (emailData.messages.length === 1) {
      const emailContent = `
      <p>Bonjour,</p>
      <p>${emailData.messages[0]}</p>
      <p>Merci.</p>`;

      await sendMail(emailData.to, 'Demande de prolongation d’un badge', emailContent);
    } else {
      const emailContent = `
      <p>Bonjour,<br/><br/>Voici une liste de badges à mettre à jour.</p>
      <ul>${emailData.messages.map((m) => `<li>${m}</li>`).join('\n')}</ul>
      <p>Merci.</p>`;

      await sendMail(emailData.to, `Demande de prolongation de ${emailData.messages.length} badges`, emailContent);
    }
  }

  return res.json({
    status: 'OK',
  });
};
