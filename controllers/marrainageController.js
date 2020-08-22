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

async function sendOnboarderRequestEmail(onboarder, newcomer, req) {
  const url = `${config.protocol}://${req.get('host')}`;

  const token = jwt.sign({
    newcomer: newcomer,
    onboarder: onboarder
  }, config.secret);

  const html = `
    <h1>Hello ${onboarder.fullname} 👋,</h1>
    <p>Tu as été sélectionné·e aléatoirement pour devenir <a href="https://doc.incubateur.net/communaute/travailler-a-beta-gouv/bienvenue/marrainage">marrain·e</a> de ${newcomer.fullname}.</p>
    <a href="${url}/marrainage/accept?details=${encodeURIComponent(token)}">
      <button style="margin-bottom: 15px;background: green;padding: 10px;border: none;border-radius: 3px;color: white;min-width: 280px;box-shadow: 1px 1px 2px 0px #333;cursor: pointer;">
        J'accepte
      </button>
    </a><br/>
    <a href="${url}/marrainage/decline?details=${encodeURIComponent(token)}">
      <button style="padding: 10px;border: none;box-shadow: 1px 1px 2px 0px #333;min-width: 280px;cursor: pointer;">
        Désolé, je ne suis pas disponible
      </button>
    </a>

    <p style="color: #999;font-size: 0.85em;">
      Tu reçois ce message car tu es considéré comme membre de la communauté beta.gouv.fr. Si ce n'est pas le cas, signale-le sur <a href="secretariat@beta.gouv.fr">secretariat@beta.gouv.fr</a>.
    </p>

    <p>Bonne journée,</p>
    <p>🤖 Le secrétariat</p>
  `;

  try {
    return await utils.sendMail(utils.buildBetaEmail(onboarder.id), `Tu as été sélectionné·e comme marrain·e 🙌`, html);
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
    const url = `${config.protocol}://${req.get('host')}`;

    await sendOnboarderRequestEmail(onboarder, newcomer, req)
    await BetaGouv.sendInfoToSlack(`À la demande de ${user.id} sur ${url}, je cherche un·e marrain·e pour ${newcomer.id}`);

    console.log(`Marrainage crée à la demande de ${user.id} pour ${newcomer.id}. Marrain·e selectionné·e : ${onboarder.id}`);

    req.flash('message', `<b>${onboarder.fullname}</b> a été invité à te marrainer. Il ou elle devrait prendre contact avec toi très bientôt !`);
    res.redirect(`/users/${newcomer.id}`);
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    res.redirect(`/users/${req.body.newcomerId}`);
  }
}

module.exports.acceptRequest = async function (req, res) {
  try {
    const details = getDataFromToken(req.query.details);
    const newcomer = details.newcomer;
    const onboarder = details.onboarder;

    const html = `
      <h1>Hello ${newcomer.fullname}, ${onboarder.fullname} 👋,</h1>
      <p>${onboarder.fullname} a accepté d'être marrain·e de ${newcomer.fullname}.</p>
      <p>Vous trouverez plus d'informations sur le marrainage sur la <a href="https://doc.incubateur.net/communaute/travailler-a-beta-gouv/bienvenue/marrainage">documentation de l'incubateur</a>.</p>
      <p>Vous êtes tou.s.tes les deux en copie de cet email, à vous de jouer ! </p>
      <p>Bonne journée,</p>
      <p>🤖 Le secrétariat</p>
    `;

    try {
      await utils.sendMail([utils.buildBetaEmail(onboarder.id), utils.buildBetaEmail(newcomer.id)], `Mise en contact pour marrainage`, html);
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
    await sendOnboarderRequestEmail(onboarder, newcomer, req);

    const html = `
      <h1>Hello ${newcomer.fullname} 👋,</h1>
      <p>Malheureusement, ${declinedOnboarder.fullname} n'est pas disponible en ce moment.</p>
      <p>Nous avons envoyé une demande de marrainage à ${onboarder.fullname}.</p>
      <p>Bonne journée,</p>
      <p>🤖 Le secrétariat</p>
    `;

    try {
      await utils.sendMail(utils.buildBetaEmail(newcomer.id), `La recherche de marrain·e se poursuit !`, html);
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
