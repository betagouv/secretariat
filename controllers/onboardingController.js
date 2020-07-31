const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('./utils')
const jwt = require('jsonwebtoken');

async function selectRandomOnboarder(newcomerId) {
  const users = await BetaGouv.usersInfos();
  const minimumSeniority = new Date().setMonth(new Date().getMonth() - 6);
  const onboarders = users.filter(x => {
    const senior = new Date(minimumSeniority) > new Date(x.start);
    const stillActive = !x.end || new Date(x.end) > new Date();
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
  const url = `${config.secure ? 'https' : 'http'}://${req.hostname}`;

  const token = jwt.sign({
    newcomer: newcomer,
    onboarder: onboarder
  }, config.secret);

  const html = `
    <h1>Hello ${onboarder.fullname} 👋,</h1>
    <p>Tu as été sélectonné.e aléatoirement pour devenir <a href="https://doc.incubateur.net/communaute/travailler-a-beta-gouv/bienvenue/marrainage">marrain.ne</a> de ${newcomer.fullname}.</p>
    <a href="${url}/onboardingRequest/accept?details=${encodeURIComponent(token)}">
      <button style="margin-bottom: 15px;background: green;padding: 10px;border: none;border-radius: 3px;color: white;min-width: 280px;box-shadow: 1px 1px 2px 0px #333;cursor: pointer;">
        J'accepte
      </button>
    </a><br/>
    <a href="${url}/onboardingRequest/decline?details=${encodeURIComponent(token)}">
      <button style="padding: 10px;border: none;box-shadow: 1px 1px 2px 0px #333;min-width: 280px;">
        Désolé, je ne suis pas disponible
      </button>
    </a>

    <p style="color: #999;font-size: 0.85em;">
      Tu reçois ce message car tu es considéré comme membre de la communauté beta.gouv.fr. Si ce n'est pas le cas, signale-le sur <a href="secretariat@beta.gouv.fr">secretariat@beta.gouv.fr</a>.
    </p>

    <p>Bonne journée,</p>
    <p>🤖 Le sécretariat</p>
  `;

  try {
    return await utils.sendMail(utils.buildBetaEmail(onboarder.id), `Tu as été sélectionné.e comme marrain.ne 🙌`, html);
  } catch (err) {
    throw new Error(`Erreur d'envoi de mail à l'adresse indiqué ${err}`);
  }
}

module.exports.createOnboardingRequest = async function (req, res) {
  try {
    const newcomer = await BetaGouv.userInfosById(req.body.newcomerId);
    const onboarder = await selectRandomOnboarder(newcomer.id);
    const user = req.user;
    const url = `${config.secure ? 'https' : 'http'}://${req.hostname}`;

    await sendOnboarderRequestEmail(onboarder, newcomer, req)
    await BetaGouv.sendInfoToSlack(`À la demande de ${user.id} sur ${url}, je cherche un.e marrain.ne pour ${newcomer.id}`);

    req.flash('message', `Nous avons envoyé un email à ${onboarder.fullname} l'invitant à te marrainer.`);
    res.redirect(`/users/${newcomer.id}`);
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    res.redirect(`/users/${id}`);
  }
}

module.exports.acceptOnboardingRequest = async function (req, res) {
  try {
    const details = getDataFromToken(req.query.details);
    const newcomer = details.newcomer;
    const onboarder = details.onboarder;

    const html = `
      <h1>Hello ${newcomer.fullname}, ${onboarder.fullname} 👋,</h1>
      <p>${onboarder.fullname} a accepté d'être marrain.ne de ${newcomer.fullname}.</p>
      <p>Vous trouverez plus d'informations sur le marrainage sur la <a href="https://doc.incubateur.net/communaute/travailler-a-beta-gouv/bienvenue/marrainage">documentation de l'incubateur</a>.</p>
      <p>Vous êtes tou.s.tes les deux en copie de cet email, à vous de jouer ! </p>
      <p>Bonne journée,</p>
      <p>🤖 Le sécretariat</p>
    `;

    try {
      await utils.sendMail([utils.buildBetaEmail(onboarder.id), utils.buildBetaEmail(newcomer.id)], `Mise en contact pour marrainage`, html);
    } catch (err) {
      throw new Error(`Erreur d'envoi de mail à l'adresse indiqué ${err}`);
    }

    req.flash('message', `Vous êtes le/la marrain.ne de ${newcomer.fullname}, vous recevrez un email de confirmation.`);
    res.redirect(`/users/${newcomer.id}`);
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    res.redirect(`/users`);
  }
}

module.exports.declineOnboardingRequest = async function (req, res) {
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
      <p>🤖 Le sécretariat</p>
    `;

    try {
      await utils.sendMail(utils.buildBetaEmail(newcomer.id), `La recherche de marrain.ne se poursuit !`, html);
    } catch (err) {
      throw new Error(`Erreur d'envoi de mail à l'adresse indiqué ${err}`);
    }

    req.flash('message', `Merci de votre réponse, elle a bien été prise en compte.`);
    res.redirect(`/users/${newcomer.id}`);
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    res.redirect(`/users`);
  }
}
