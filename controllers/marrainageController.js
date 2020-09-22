const ejs = require('ejs');
const jwt = require('jsonwebtoken');

const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('./utils');


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

function getDataFromToken(token) {
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
  return data;
}

async function sendOnboarderRequestEmail(newcomer, onboarder, req) {
  const token = jwt.sign({
    newcomer: newcomer,
    onboarder: onboarder
  }, config.secret);

  const marrainageAcceptUrl = `${config.protocol}://${req.get('host')}/marrainage/accept?details=${encodeURIComponent(token)}`;
  const marrainageDeclineUrl = `${config.protocol}://${req.get('host')}/marrainage/decline?details=${encodeURIComponent(token)}`;

  const html = await ejs.renderFile("./views/emails/marrainageRequest.ejs", { newcomer, onboarder, marrainageAcceptUrl, marrainageDeclineUrl });

  try {
    return await utils.sendMail([utils.buildBetaEmail(onboarder.id),config.senderEmail], `Tu as été sélectionné·e comme marrain·e 🙌`, html);
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

    await sendOnboarderRequestEmail(newcomer, onboarder, req)
    await BetaGouv.sendInfoToSlack(`À la demande de ${user.id} sur ${secretariatUrl}, je cherche un·e marrain·e pour ${newcomer.id}`);

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
    const details = getDataFromToken(req.query.details);
    const newcomer = details.newcomer;
    const onboarder = details.onboarder;

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
    const details = getDataFromToken(req.query.details);
    const newcomer = details.newcomer;
    const declinedOnboarder = details.onboarder;

    const onboarder = await selectRandomOnboarder(newcomer.id);
    await sendOnboarderRequestEmail(newcomer, onboarder, req);

    const html = await ejs.renderFile("./views/emails/marrainageDecline.ejs", { newcomer, declinedOnboarder, onboarder });

    try {
      await utils.sendMail([utils.buildBetaEmail(newcomer.id),config.senderEmail], `La recherche de marrain·e se poursuit !`, html);
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
