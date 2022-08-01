import config from "../config";
import BetaGouv from "../betagouv";
import * as utils from "./utils";
import knex from "../db";
import { MemberWithPermission } from "../models/member";
import { CommunityPage } from '../views';

const EMAIL_STATUS_READABLE_FORMAT = {
  EMAIL_ACTIVE: 'Actif',
  EMAIL_SUSPENDED: 'Suspendu',
  EMAIL_DELETED: 'Supprimé',
  EMAIL_EXPIRED: 'Expiré',
  EMAIL_CREATION_PENDING: 'Création en cours',
  EMAIL_RECREATION_PENDING: 'Recréation en cours',
  EMAIL_UNSET: 'Non défini'
}

export async function getCommunity(req, res) {
  if (req.query.username) {
    return res.redirect(`/community/${req.query.username}`);
  }
  try {
    const users = await BetaGouv.usersInfos();
    const title = 'Communauté';
    return res.send(CommunityPage({
      title,
      currentUserId: req.auth.id,
      users,
      activeTab: 'community',
      errors: req.flash('error'),
      messages: req.flash('message'),
      request: req
    }));
  } catch (err) {
    console.error(err);
    return res.send('Erreur interne : impossible de récupérer les informations de la communauté');
  }
}

export async function getUser(req, res) {
  const { username } = req.params;
  const isCurrentUser = req.auth.id === username;

  try {
    if (isCurrentUser) {
      res.redirect('/account');
      return;
    }

    const [user] : [MemberWithPermission] = await Promise.all([
      utils.userInfos(username, isCurrentUser),
    ]);

    const hasGithubFile = user.userInfos;
    const hasEmailAddress = (user.emailInfos || user.redirections.length > 0);
    if (!hasGithubFile && !hasEmailAddress) {
      req.flash('error', 'Il n\'y a pas de membres avec ce compte mail. Vous pouvez commencez par créer une fiche sur Github pour la personne <a href="/onboarding">en cliquant ici</a>.');
      res.redirect('/community');
      return;
    }
    const marrainageStateResponse = await knex('marrainage').select()
      .where({ username });
    const marrainageState = marrainageStateResponse[0];

    const dbRes = await knex('users').where({ username })
    const secondaryEmail = dbRes.length === 1 ? dbRes[0].secondary_email : '';

    const title = user.userInfos ? user.userInfos.fullname : null;
    res.render('user', {
      title,
      username,
      currentUserId: req.auth.id,
      emailInfos: user.emailInfos,
      redirections: user.redirections,
      userInfos: user.userInfos,
      isExpired: user.isExpired,
      primaryEmailStatus: dbRes.length === 1 ? EMAIL_STATUS_READABLE_FORMAT[dbRes[0].primary_email_status] : '',
      canCreateEmail: user.canCreateEmail,
      errors: req.flash('error'),
      messages: req.flash('message'),
      domain: config.domain,
      marrainageState,
      activeTab: 'community',
      secondaryEmail,
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Impossible de récupérer les informations du membre de la communauté.');
    res.redirect('/');
  }
}
