import ejs from 'ejs';
import jwt from 'jsonwebtoken';
import config from '../config';
import BetaGouv from '../betagouv';
import * as utils from './utils';
import knex from '../db';
import { addEvent, EventCode } from '../lib/events'
import { CommunicationEmailCode, DBUser } from '../models/dbUser';
import { Member } from '../models/member';
import { MarrainageService1v, MarrainageServiceWithGroup } from '../services/marrainageService';

const MarrainageService =
  config.FEATURE_USE_NEW_MARRAINAGE && config.ONBOARDER_IN_LIST ? new MarrainageServiceWithGroup(config.ONBOARDER_IN_LIST) : new MarrainageService1v()

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

async function sendOnboarderRequestEmail(newcomer: Member, onboarder: Member) {
  const token = jwt.sign(
    {
      newcomerId: newcomer.id,
      onboarderId: onboarder.id,
    },
    config.secret,
    { expiresIn: 7 * 24 * 3600 }
  );

  const marrainageAcceptUrl = `${config.protocol}://${
    config.host
  }/marrainage/accept?details=${encodeURIComponent(token)}`;
  const marrainageDeclineUrl = `${config.protocol}://${
    config.host
  }/marrainage/decline?details=${encodeURIComponent(token)}`;

  const startup = newcomer.startups && newcomer.startups.length > 0 ? newcomer.startups[0] : null;

  const html = await ejs.renderFile('./src/views/templates/emails/marrainageRequest.ejs', {
    newcomer,
    onboarder,
    marrainageAcceptUrl,
    marrainageDeclineUrl,
    startup,
  });
  const dbOnboarder: DBUser = await knex('users').where({
    username: onboarder.id
  }).first()
  try {
    const email = dbOnboarder.communication_email === CommunicationEmailCode.SECONDARY && dbOnboarder.secondary_email ? dbOnboarder.secondary_email : dbOnboarder.primary_email
    return await utils.sendMail(
      [email],
      'Tu as été sélectionné·e comme marrain·e 🙌',
      html
    );
  } catch (err) {
    throw new Error(`Erreur d'envoi de mail à l'adresse indiqué ${err}`);
  }
}

function redirectOutdatedMarrainage(req, res) {
  req.flash(
    'message',
    "Merci de ta réponse. Cette demande n'est plus d'actualité. Ce sera pour une prochaine fois 🙂"
  );
  return res.redirect('/');
}

export async function reloadMarrainage(newcomerId) {
  const newcomer: Member = await BetaGouv.userInfosById(newcomerId);

  if (!newcomer) {
    throw new Error(
      `${newcomerId} ne fais pas partie de la communauté beta.gouv`
    );
  }

  const marrainageDetailsReponse = await knex('marrainage')
    .select()
    .where({ username: newcomer.id, completed: false });

  if (marrainageDetailsReponse.length !== 1) {
    throw new Error(
      "Il n'y a pas de demande de marrainage existant pour cette personne."
    );
  }
  const onboarder = await MarrainageService.selectRandomOnboarder(newcomer.id, newcomer.domaine);

  if (!onboarder) {
    throw new Error(
      `Erreur lors de la relance de marrainage pour ${newcomer.id} : Aucun·e marrain·e n'est disponible pour le moment.`
    );
  }
  console.log(`Select ${onboarder.id} (${onboarder.domaine} for ${newcomer.id} (${newcomer.domaine}))`)
  await MarrainageService.createMarrainage(newcomer.id, onboarder.id);

  await sendOnboarderRequestEmail(newcomer, onboarder);
  console.log(
    `Marrainage relancé pour ${newcomer.id}. Ancien·e marrain·e : ${marrainageDetailsReponse[0].last_onboarder}. Nouvel.le marrain·e : ${onboarder.id}`
  );
  return { newcomer, onboarder };
}

export async function createRequestForUser(userId) {
  console.log('Creating marrainage request for', userId)
  const newcomer: Member = await BetaGouv.userInfosById(userId);
  const onboarder = await MarrainageService.selectRandomOnboarder(newcomer.id, newcomer.domaine);

  if (!onboarder) {
    const recipientEmailList = [config.senderEmail];
    const errorMessage = "Aucun·e marrain·e n'est disponible pour le moment";
    const emailContent = `
      <p>Bonjour,</p>
      <p>Erreur de création de la demande de marrainage pour ${userId} avec l'erreur :</>
      <p>${errorMessage}</p>`;
    utils.sendMail(
      recipientEmailList,
      `La demande de marrainage pour ${userId} n'a pas fonctionné`,
      emailContent
    );
    throw new Error(errorMessage);
  }

  await knex('marrainage').insert({
    username: newcomer.id,
    last_onboarder: onboarder.id,
  });
  await sendOnboarderRequestEmail(newcomer, onboarder);
  return {
    newcomer,
    onboarder,
  };
}

export async function createRequest(req, res) {
  try {
    const newcomerId = req.sanitize(req.body.newcomerId);
    const loggedUserInfo = await BetaGouv.userInfosById(req.auth.id);
    if (utils.checkUserIsExpired(loggedUserInfo)) {
      throw new Error(
        'Vous ne pouvez pas demander un·e marrain·e car votre compte a une date de fin expiré sur Github.'
      );
    }
    const { newcomer, onboarder } = await createRequestForUser(newcomerId);
    const { user } = req;
    console.log(
      `Marrainage crée à la demande de ${user.id} pour ${newcomer.id}. Marrain·e selectionné·e : ${onboarder.id}`
    );
    addEvent(EventCode.MARRAINAGE_CREATED, {
      created_by_username: user.id,
      action_on_username: newcomer.id
    })

    if (newcomer.id === req.auth.id)
      req.flash(
        'message',
        `<b>${onboarder.fullname}</b> a été invité à te marrainer. Il ou elle devrait prendre contact avec toi très bientôt !`
      );
    else
      req.flash(
        'message',
        `<b>${onboarder.fullname}</b> a été invité à marrainer ${newcomer.fullname}.`
      );

    res.redirect(`/community/${newcomer.id}`);
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    res.redirect(`/community/${req.body.newcomerId}`);
  }
}

export async function acceptRequest(req, res) {
  try {
    const details = await getMarrainageTokenData(req.query.details);
    const newcomer: Member = details.newcomer;
    const onboarder: Member = details.onboarder;

    const marrainageDetailsReponse = await knex('marrainage')
      .select()
      .where({
        username: newcomer.id,
        last_onboarder: onboarder.id,
        completed: false,
      });

    if (marrainageDetailsReponse.length !== 1) {
      console.log(
        `Marrainage accepté non existant pour ${newcomer.id}. Marrain·e indiqué·e : ${onboarder.id}`
      );
      return redirectOutdatedMarrainage(req, res);
    }

    await knex('marrainage')
      .where({ username: newcomer.id })
      .update({ completed: true, last_updated: knex.fn.now() });
    addEvent(EventCode.MARRAINAGE_ACCEPTED, {
      created_by_username: onboarder.id,
      action_on_username: onboarder.id
    })
    const htmlOnboarder = await ejs.renderFile('./src/views/templates/emails/marrainageAcceptOnboarder.ejs', {
      newcomer,
      onboarder,
    });
    const htmlNewcomer = await ejs.renderFile('./src/views/templates/emails/marrainageAcceptNewcomer.ejs', {
      newcomer,
      onboarder,
    });
    const dbUsers: DBUser[] = await knex('users').whereIn(
      'username', [onboarder.id, newcomer.id]
    )
    const dbOnboarder: DBUser = dbUsers.find(user => user.username === onboarder.id)
    const dbNewcomer: DBUser = dbUsers.find(user => user.username === newcomer.id)
    try {
      const emailOnboarder = dbOnboarder.communication_email === CommunicationEmailCode.SECONDARY && dbOnboarder.secondary_email ? dbOnboarder.secondary_email : dbOnboarder.primary_email
      const emailNewcomer = dbNewcomer.communication_email === CommunicationEmailCode.SECONDARY && dbNewcomer.secondary_email ? dbNewcomer.secondary_email : dbNewcomer.primary_email

      await utils.sendMail(
        emailOnboarder,
        'Mise en contact 👋',
        htmlOnboarder,
        { replyTo: emailNewcomer}
      );
      await utils.sendMail(
        emailNewcomer,
        'Mise en contact 👋',
        htmlNewcomer,
        { replyTo: emailOnboarder}
      );
    } catch (err) {
      throw new Error(`Erreur d'envoi de mail à l'adresse indiqué ${err}`);
    }

    console.log(
      `Marrainage accepté pour ${newcomer.id}. Marrain·e selectionné·e : ${onboarder.id}`
    );

    return res.render('marrainage', { errors: undefined, accepted: true });
  } catch (err) {
    console.error(err);
    if (err.name === 'TokenExpiredError') {
      return redirectOutdatedMarrainage(req, res);
    }
    return res.render('marrainage', { errors: err.message });
  }
}

export async function declineRequest(req, res) {
  try {
    const details = await getMarrainageTokenData(req.query.details);
    const newcomer: Member = details.newcomer;
    const declinedOnboarder: Member = details.onboarder;

    const marrainageDetailsReponse = await knex('marrainage')
      .select()
      .where({
        username: newcomer.id,
        last_onboarder: declinedOnboarder.id,
        completed: false,
      });
    addEvent(EventCode.MEMBER_MARRAINAGE_DECLINED, {
      created_by_username: declinedOnboarder.id,
      action_on_username: declinedOnboarder.id
    })
    if (marrainageDetailsReponse.length !== 1) {
      console.log(
        `Marrainage refusé non existant pour ${newcomer.id}. Marrain·e indiqué·e : ${declinedOnboarder.id}`
      );
      return redirectOutdatedMarrainage(req, res);
    }

    const onboarder = await MarrainageService.selectRandomOnboarder(newcomer.id, newcomer.domaine);

    if (!onboarder) {
      console.log(
        `Erreur lors du refus de marrainage pour ${newcomer.id} : Aucun·e marrain·e n'est disponible pour le moment.`
      );
      req.flash(
        'error',
        "Aucun·e autre marrain·e n'est disponible pour le moment"
      );
      return res.redirect('/');
    }

    await knex('marrainage')
      .where({ username: newcomer.id })
      .increment('count', 1)
      .update({ last_onboarder: onboarder.id, last_updated: knex.fn.now() });

    await sendOnboarderRequestEmail(newcomer, onboarder);

    console.log(
      `Marrainage décliné pour ${newcomer.id}. Ancien·e marrain·e : ${declinedOnboarder.id}. Nouvel.le marrain·e : ${onboarder.id}`
    );

    return res.render('marrainage', { errors: undefined, accepted: false });
  } catch (err) {
    console.error(err);
    if (err.name === 'TokenExpiredError') {
      return redirectOutdatedMarrainage(req, res);
    }
    return res.render('marrainage', { errors: err.message });
  }
}

export async function reloadRequest(req, res) {
  try {
    const { newcomer, onboarder } = await reloadMarrainage(req.body.newcomerId);

    if (req.body.newcomerId === req.auth.id)
      req.flash(
        'message',
        `<b>${onboarder.fullname}</b> a été invité à te marrainer. Il ou elle devrait prendre contact avec toi très bientôt !`
      );
    else
      req.flash(
        'message',
        `<b>${onboarder.fullname}</b> a été invité à marrainer ${newcomer.fullname}.`
      );

    return res.redirect(`/community/${newcomer.id}`);
  } catch (err) {
    if (err.message.includes('Marrainage non existant')) {
      req.flash(
        'error',
        "Il n'y a pas de demande de marrainage existant pour cette personne."
      );
    }
    console.error(err);
    return res.redirect(`/community/${req.body.newcomerId}`);
  }
}

export async function cancelRequest(req, res) {
  try {
    const newcomer = await BetaGouv.userInfosById(req.body.newcomerId);

    const marrainageDetailsReponse = await knex('marrainage')
      .select()
      .where({ username: newcomer.id, completed: false });

    if (marrainageDetailsReponse.length !== 1) {
      console.log(`Marrainage non existant pour ${newcomer.id}.`);
      req.flash(
        'error',
        "Il n'y a pas de demande de marrainage existant pour cette personne."
      );
      return res.redirect(`/community/${newcomer.id}`);
    }

    await knex('marrainage').where({ username: newcomer.id }).del();

    console.log(`Marrainage supprimé pour ${newcomer.id}.`);

    req.flash('message', `Marrainage supprimé pour ${newcomer.id}.`);

    return res.redirect(`/community/${newcomer.id}`);
  } catch (err) {
    console.error(err);
    return res.redirect(`/community/${req.body.newcomerId}`);
  }
}
