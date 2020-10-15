const ejs = require('ejs');
const jwt = require('jsonwebtoken');

const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('./utils');
const knex = require('../db');

async function selectRandomOnboarder(newcomerId) {
  const users = await BetaGouv.usersInfos();
  const minimumSeniority = new Date().setMonth(new Date().getMonth() - 6);
  const onboarders = users.filter(x => {
    const senior = new Date(minimumSeniority) > new Date(x.start);
    const stillActive = !utils.checkUserIsExpired(x);
    const isRequester = x.id === newcomerId;
    return senior && stillActive && !isRequester;
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
  const newcomerId = data.newcomerId;
  const onboarderId = data.onboarderId;
  const userInfos = await BetaGouv.usersInfos();
  return {
    newcomer: userInfos.find(x => x.id == newcomerId),
    onboarder: userInfos.find(x => x.id == onboarderId)
  };
}

async function sendOnboarderRequestEmail(newcomer, onboarder, req) {
  const token = jwt.sign({
    newcomerId: newcomer.id,
    onboarderId: onboarder.id
  }, config.secret);

  const marrainageAcceptUrl = `${config.protocol}://${req.get('host')}/marrainage/accept?details=${encodeURIComponent(token)}`;
  const marrainageDeclineUrl = `${config.protocol}://${req.get('host')}/marrainage/decline?details=${encodeURIComponent(token)}`;

  const html = await ejs.renderFile("./views/emails/marrainageRequest.ejs", { newcomer, onboarder, marrainageAcceptUrl, marrainageDeclineUrl });

  try {
    return await utils.sendMail([utils.buildBetaEmail(onboarder.id)], `Tu as été sélectionné·e comme marrain·e 🙌`, html);
  } catch (err) {
    throw new Error(`Erreur d'envoi de mail à l'adresse indiqué ${err}`);
  }
}

module.exports.createRequest = async function (req, res) {
  try {
    const loggedUserInfo = await BetaGouv.userInfosById(req.user.id)
    if (utils.checkUserIsExpired(loggedUserInfo)) {
      throw new Error("Vous ne pouvez pas demander un·e marrain·e car votre compte a une date de fin expiré sur Github.");
    }
    const newcomer = await BetaGouv.userInfosById(req.body.newcomerId);
    const onboarder = await selectRandomOnboarder(newcomer.id);
    const user = req.user;
    const secretariatUrl = `${config.protocol}://${req.get('host')}`;

    await knex('marrainage').insert({
      username: newcomer.id,
      last_onboarder: onboarder.id
    });
    await sendOnboarderRequestEmail(newcomer, onboarder, req)

    console.log(`Marrainage crée à la demande de ${user.id} pour ${newcomer.id}. Marrain·e selectionné·e : ${onboarder.id}`);

    if (newcomer.id === req.user.id)
      req.flash('message', `<b>${onboarder.fullname}</b> a été invité à te marrainer. Il ou elle devrait prendre contact avec toi très bientôt !`);
    else
      req.flash('message', `<b>${onboarder.fullname}</b> a été invité à marrainer ${newcomer.fullname}.`);

    res.redirect(`/community/${newcomer.id}`);
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    res.redirect(`/community/${req.body.newcomerId}`);
  }
}

module.exports.acceptRequest = async function (req, res) {
  try {
    const details = await getMarrainageTokenData(req.query.details);
    const newcomer = details.newcomer;
    const onboarder = details.onboarder;

    const marrainageDetailsReponse = await knex('marrainage').select()
    .where({ username: newcomer.id, last_onboarder: onboarder.id, completed: false });

    if (marrainageDetailsReponse.length !== 1) {
      console.log(`Marrainage accepté non existant pour ${newcomer.id}. Marrain·e indiqué·e : ${onboarder.id}`);
      req.flash("error", "Il n'y a pas de demande de marrainage existant pour cette personne (Vous avez peut-être déjà accepté ou refusé cette demande)");
      return res.redirect('/');
    }

    await knex('marrainage')
      .where({ username: newcomer.id })
      .update({ completed: true, last_updated: knex.fn.now() });

    const html = await ejs.renderFile("./views/emails/marrainageAccept.ejs", { newcomer, onboarder });
    try {
      await utils.sendMail([utils.buildBetaEmail(onboarder.id), utils.buildBetaEmail(newcomer.id),config.senderEmail], `Mise en contact pour marrainage`, html);
    } catch (err) {
      throw new Error(`Erreur d'envoi de mail à l'adresse indiqué ${err}`);
    }

    console.log(`Marrainage accepté pour ${newcomer.id}. Marrain·e selectionné·e : ${onboarder.id}`);

    res.render('marrainage', {errors: undefined});
  } catch (err) {
    console.error(err);
    res.render('marrainage', {errors: err.message});
  }
}

module.exports.declineRequest = async function (req, res) {
  try {
    const details = await getMarrainageTokenData(req.query.details);
    const newcomer = details.newcomer;
    const declinedOnboarder = details.onboarder;


    const marrainageDetailsReponse = await knex('marrainage').select()
    .where({ username: newcomer.id, last_onboarder: declinedOnboarder.id, completed: false });

    if (marrainageDetailsReponse.length !== 1) {
      console.log(`Marrainage refusé non existant pour ${newcomer.id}. Marrain·e indiqué·e : ${declinedOnboarder.id}`);
      req.flash("error", "Il n'y a pas de demande de marrainage existant pour cette personne (Vous avez peut-être déjà accepté ou refusé cette demande)");
      return res.redirect('/');
    }

    const onboarder = await selectRandomOnboarder(newcomer.id);

    await knex('marrainage')
      .where({ username: newcomer.id })
      .increment('count', 1)
      .update({ last_onboarder: onboarder.id, last_updated: knex.fn.now() });

    await sendOnboarderRequestEmail(newcomer, onboarder, req);

    const html = await ejs.renderFile("./views/emails/marrainageDecline.ejs", { newcomer, declinedOnboarder, onboarder });

    try {
      await utils.sendMail([utils.buildBetaEmail(newcomer.id)], `La recherche de marrain·e se poursuit !`, html);
    } catch (err) {
      throw new Error(`Erreur d'envoi de mail à l'adresse indiqué ${err}`);
    }

    console.log(`Marrainage décliné pour ${newcomer.id}. Ancien·e marrain·e : ${declinedOnboarder.id}. Nouvel.le marrain·e : ${onboarder.id}`);

    res.render('marrainage', {errors: undefined});
  } catch (err) {
    console.error(err);
    res.render('marrainage', {errors: err.message});
  }
}

module.exports.reloadRequest = async function (req, res) {
  try {
    const newcomer = await BetaGouv.userInfosById(req.body.newcomerId);

    const marrainageDetailsReponse = await knex('marrainage').select()
    .where({ username: newcomer.id, completed: false });

    if (marrainageDetailsReponse.length !== 1) {
      console.log(`Marrainage non existant pour ${newcomer.id}.`);
      req.flash("error", "Il n'y a pas de demande de marrainage existant pour cette personne.");
      return res.redirect(`/community/${newcomer.id}`);;
    }

    const onboarder = await selectRandomOnboarder(newcomer.id);

    await knex('marrainage')
      .where({ username: newcomer.id })
      .increment('count', 1)
      .update({ last_onboarder: onboarder.id, last_updated: knex.fn.now() });

    await sendOnboarderRequestEmail(newcomer, onboarder, req);

    console.log(`Marrainage relancé pour ${newcomer.id}. Ancien·e marrain·e : ${marrainageDetailsReponse[0].last_onboarder}. Nouvel.le marrain·e : ${onboarder.id}`);

    if (newcomer.id === req.user.id)
      req.flash('message', `<b>${onboarder.fullname}</b> a été invité à te marrainer. Il ou elle devrait prendre contact avec toi très bientôt !`);
    else
      req.flash('message', `<b>${onboarder.fullname}</b> a été invité à marrainer ${newcomer.fullname}.`);

    res.redirect(`/community/${newcomer.id}`);
  } catch (err) {
    console.error(err);
    res.redirect(`/community/${newcomer.id}`);
  }
}

module.exports.cancelRequest = async function (req, res) {
  try {
    const newcomer = await BetaGouv.userInfosById(req.body.newcomerId);

    const marrainageDetailsReponse = await knex('marrainage').select()
    .where({ username: newcomer.id, completed: false });

    if (marrainageDetailsReponse.length !== 1) {
      console.log(`Marrainage non existant pour ${newcomer.id}.`);
      req.flash("error", "Il n'y a pas de demande de marrainage existant pour cette personne.");
      return res.redirect(`/community/${newcomer.id}`);;
    }

    await knex('marrainage')
      .where({ username: newcomer.id })
      .del()

    console.log(`Marrainage supprimé pour ${newcomer.id}.`);

    req.flash('message', `Marrainage supprimé pour ${newcomer.id}.`);

    res.redirect(`/community/${newcomer.id}`);
  } catch (err) {
    console.error(err);
    res.redirect(`/community/${newcomer.id}`);
  }
}