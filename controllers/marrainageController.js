const ejs = require('ejs');
const jwt = require('jsonwebtoken');

const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('./utils');
const knex = require('../db');

async function selectRandomOnboarder(newcomerId) {
  const users = await BetaGouv.usersInfos();
  const minimumSeniority = new Date().setMonth(new Date().getMonth() - 6);
  const existingCandidates = await knex('marrainage')
    .select('last_onboarder')
    .where({ completed: false })
    .distinct()
    .then((results) => results.map((x) => x.last_onboarder));

  const onboarders = users.filter((x) => {
    const existingCandidate = existingCandidates.includes(x.id);
    const senior = new Date(minimumSeniority) > new Date(x.start);
    const stillActive = !utils.checkUserIsExpired(x);
    const isRequester = x.id === newcomerId;
    return !existingCandidate && senior && stillActive && !isRequester;
  });
  const onboarder = onboarders[Math.floor(Math.random() * onboarders.length)];
  return onboarder;
}

async function getMarrainageTokenData(token) {
  if (!token) {
    throw new Error('Token missing');
  }
  const jwtIsValid = jwt.verify(token, config.secret);
  if (!jwtIsValid) {
    throw new Error('Invalid token in link');
  }
  const data = jwt.decode(token, { json: true });
  if (!data) {
    throw new Error('Corrupted data in token');
  }

  const isLegacyToken = data.newcomer && data.onboarder;
  if (isLegacyToken) {
    return {
      newcomer: data.newcomer,
      onboarder: data.onboarder,
    };
  }
  const { newcomerId } = data;
  const { onboarderId } = data;
  const userInfos = await BetaGouv.usersInfos();
  return {
    newcomer: userInfos.find((x) => x.id === newcomerId),
    onboarder: userInfos.find((x) => x.id === onboarderId),
  };
}

async function sendOnboarderRequestEmail(newcomer, onboarder) {
  const token = jwt.sign({
    newcomerId: newcomer.id,
    onboarderId: onboarder.id,
  }, config.secret, { expiresIn: 7 * 24 * 3600 });

  const marrainageAcceptUrl = `${config.protocol}://${config.host}/marrainage/accept?details=${encodeURIComponent(token)}`;
  const marrainageDeclineUrl = `${config.protocol}://${config.host}/marrainage/decline?details=${encodeURIComponent(token)}`;

  const html = await ejs.renderFile('./views/emails/marrainageRequest.ejs', {
    newcomer, onboarder, marrainageAcceptUrl, marrainageDeclineUrl,
  });

  try {
    return await utils.sendMail([utils.buildBetaEmail(onboarder.id)], 'Tu as été sélectionné·e comme marrain·e 🙌', html);
  } catch (err) {
    throw new Error(`Erreur d'envoi de mail à l'adresse indiqué ${err}`);
  }
}

module.exports.reloadMarrainage = async function (newcomerId) {
  const newcomer = await BetaGouv.userInfosById(newcomerId);

  const marrainageDetailsReponse = await knex('marrainage').select()
    .where({ username: newcomer.id, completed: false });

  if (marrainageDetailsReponse.length !== 1) {
    throw new Error("Il n'y a pas de demande de marrainage existant pour cette personne.");
  }
  const onboarder = await selectRandomOnboarder(newcomer.id);

  if (!onboarder) {
    throw new Error(`Erreur lors de la relance de marrainage pour ${newcomer.id} : Aucun·e marrain·e n'est disponible pour le moment.`);
  }

  await knex('marrainage')
    .where({ username: newcomer.id })
    .increment('count', 1)
    .update({ last_onboarder: onboarder.id, last_updated: knex.fn.now() });

  await sendOnboarderRequestEmail(newcomer, onboarder);
  console.log(`Marrainage relancé pour ${newcomer.id}. Ancien·e marrain·e : ${marrainageDetailsReponse[0].last_onboarder}. Nouvel.le marrain·e : ${onboarder.id}`);
  return { newcomer, onboarder };
};

module.exports.createRequestForUser = async function (userId) {
  const newcomer = await BetaGouv.userInfosById(userId);
  const onboarder = await selectRandomOnboarder(newcomer.id);

  if (!onboarder) {
    const recipientEmailList = [config.senderEmail];
    const errorMessage = "Aucun·e marrain·e n'est disponible pour le moment";
    const emailContent = `
      <p>Bonjour,</p>
      <p>Erreur de création de la demande de marrainage pour ${userId} avec l'erreur :</>
      <p>${errorMessage}</p>`;
    utils.sendMail(recipientEmailList, `La demande de marrainage pour ${userId} n'a pas fonctionné`, emailContent);
    throw new Error(errorMessage);
  }
  const toto = 0;
  await knex('marrainage').insert({
    username: newcomer.id,
    last_onboarder: onboarder.id,
  });
  await sendOnboarderRequestEmail(newcomer, onboarder);
  return {
    newcomer,
    onboarder,
  };
};

module.exports.createRequest = async function (req, res) {
  try {
    const newcomerId = req.sanitize(req.body.newcomerId);
    const loggedUserInfo = await BetaGouv.userInfosById(req.user.id);
    if (utils.checkUserIsExpired(loggedUserInfo)) {
      throw new Error('Vous ne pouvez pas demander un·e marrain·e car votre compte a une date de fin expiré sur Github.');
    }
    const { newcomer, onboarder } = await module.exports.createRequestForUser(newcomerId);
    const { user } = req;
    console.log(`Marrainage crée à la demande de ${user.id} pour ${newcomer.id}. Marrain·e selectionné·e : ${onboarder.id}`);

    if (newcomer.id === req.user.id) req.flash('message', `<b>${onboarder.fullname}</b> a été invité à te marrainer. Il ou elle devrait prendre contact avec toi très bientôt !`);
    else req.flash('message', `<b>${onboarder.fullname}</b> a été invité à marrainer ${newcomer.fullname}.`);

    res.redirect(`/community/${newcomer.id}`);
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    res.redirect(`/community/${req.body.newcomerId}`);
  }
};

module.exports.acceptRequest = async function (req, res) {
  try {
    const details = await getMarrainageTokenData(req.query.details);
    const { newcomer } = details;
    const { onboarder } = details;

    const marrainageDetailsReponse = await knex('marrainage').select()
      .where({ username: newcomer.id, last_onboarder: onboarder.id, completed: false });

    if (marrainageDetailsReponse.length !== 1) {
      console.log(`Marrainage accepté non existant pour ${newcomer.id}. Marrain·e indiqué·e : ${onboarder.id}`);
      req.flash('error', "Il n'y a pas de demande de marrainage existant pour cette personne (vous avez peut-être déjà accepté ou refusé cette demande).");
      return res.redirect('/');
    }

    await knex('marrainage')
      .where({ username: newcomer.id })
      .update({ completed: true, last_updated: knex.fn.now() });

    const html = await ejs.renderFile('./views/emails/marrainageAccept.ejs', { newcomer, onboarder });
    try {
      await utils.sendMail([utils.buildBetaEmail(onboarder.id), utils.buildBetaEmail(newcomer.id), config.senderEmail], 'Mise en contact 👋', html);
    } catch (err) {
      throw new Error(`Erreur d'envoi de mail à l'adresse indiqué ${err}`);
    }

    console.log(`Marrainage accepté pour ${newcomer.id}. Marrain·e selectionné·e : ${onboarder.id}`);

    return res.render('marrainage', { errors: undefined, accepted: true });
  } catch (err) {
    console.error(err);
    return res.render('marrainage', { errors: err.message });
  }
};

module.exports.declineRequest = async function (req, res) {
  try {
    const details = await getMarrainageTokenData(req.query.details);
    const { newcomer } = details;
    const declinedOnboarder = details.onboarder;

    const marrainageDetailsReponse = await knex('marrainage').select()
      .where({ username: newcomer.id, last_onboarder: declinedOnboarder.id, completed: false });

    if (marrainageDetailsReponse.length !== 1) {
      console.log(`Marrainage refusé non existant pour ${newcomer.id}. Marrain·e indiqué·e : ${declinedOnboarder.id}`);
      req.flash('error', "Il n'y a pas de demande de marrainage existant pour cette personne (vous avez peut-être déjà accepté ou refusé cette demande).");
      return res.redirect('/');
    }

    const onboarder = await selectRandomOnboarder(newcomer.id);

    if (!onboarder) {
      console.log(`Erreur lors du refus de marrainage pour ${newcomer.id} : Aucun·e marrain·e n'est disponible pour le moment.`);
      req.flash('error', "Aucun·e autre marrain·e n'est disponible pour le moment");
      return res.redirect('/');
    }

    await knex('marrainage')
      .where({ username: newcomer.id })
      .increment('count', 1)
      .update({ last_onboarder: onboarder.id, last_updated: knex.fn.now() });

    await sendOnboarderRequestEmail(newcomer, onboarder, req);

    console.log(`Marrainage décliné pour ${newcomer.id}. Ancien·e marrain·e : ${declinedOnboarder.id}. Nouvel.le marrain·e : ${onboarder.id}`);

    return res.render('marrainage', { errors: undefined, accepted: false });
  } catch (err) {
    console.error(err);
    return res.render('marrainage', { errors: err.message });
  }
};

module.exports.reloadRequest = async function (req, res) {
  try {
    const { newcomer, onboarder } = await module.exports.reloadMarrainage(req.body.newcomerId);

    if (req.body.newcomerId === req.user.id) req.flash('message', `<b>${onboarder.fullname}</b> a été invité à te marrainer. Il ou elle devrait prendre contact avec toi très bientôt !`);
    else req.flash('message', `<b>${onboarder.fullname}</b> a été invité à marrainer ${newcomer.fullname}.`);

    return res.redirect(`/community/${newcomer.id}`);
  } catch (err) {
    if (err.message.includes('Marrainage non existant')) {
      req.flash('error', "Il n'y a pas de demande de marrainage existant pour cette personne.");
    }
    console.error(err);
    return res.redirect(`/community/${req.body.newcomerId}`);
  }
};

module.exports.cancelRequest = async function (req, res) {
  try {
    const newcomer = await BetaGouv.userInfosById(req.body.newcomerId);

    const marrainageDetailsReponse = await knex('marrainage').select()
      .where({ username: newcomer.id, completed: false });

    if (marrainageDetailsReponse.length !== 1) {
      console.log(`Marrainage non existant pour ${newcomer.id}.`);
      req.flash('error', "Il n'y a pas de demande de marrainage existant pour cette personne.");
      return res.redirect(`/community/${newcomer.id}`);
    }

    await knex('marrainage')
      .where({ username: newcomer.id })
      .del();

    console.log(`Marrainage supprimé pour ${newcomer.id}.`);

    req.flash('message', `Marrainage supprimé pour ${newcomer.id}.`);

    return res.redirect(`/community/${newcomer.id}`);
  } catch (err) {
    console.error(err);
    return res.redirect(`/community/${req.body.newcomerId}`);
  }
};
