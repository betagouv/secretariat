import config from '../config';
import BetaGouv from '../betagouv';
import * as utils from './utils';
import knex from '../db';
import { MemberWithPermission } from '@models/member';
import { CommunityPage } from '../views';
import betagouv from '../betagouv';
import { EMAIL_STATUS_READABLE_FORMAT } from '@/models/misc';

export async function getCommunity(req, res) {
  getCommunityPageData(
    req,
    res,
    (data) => {
      res.send(
        CommunityPage({
          ...data,
          errors: req.flash('error'),
          messages: req.flash('message'),
          request: req,
        })
      );
    },
    (err) => {
      console.error(err);
      return res.send(
        'Erreur interne : impossible de récupérer les informations de la communauté'
      );
    }
  );
}

export async function getCommunityApi(req, res) {
  getCommunityPageData(
    req,
    res,
    (data) => {
      res.json({
        ...data,
      });
    },
    (err) => {
      res.status(500).json({
        error:
          'Erreur interne : impossible de récupérer les informations de la communauté',
      });
    }
  );
}

export async function getCommunityPageData(req, res, onSuccess, onError) {
  if (req.query.username) {
    return res.redirect(`/community/${req.query.username}`);
  }

  try {
    const users = await BetaGouv.usersInfos();
    const incubators = await BetaGouv.incubators();
    const startups = await BetaGouv.startupsInfos();
    const title = 'Communauté';
    return {
      title,
      currentUserId: req.auth.id,
      incubatorOptions: Object.keys(incubators).map((incubator) => {
        return {
          value: incubator,
          label: incubators[incubator].title,
        };
      }),
      startupOptions: startups.map((startup) => {
        return {
          value: startup.id,
          label: startup.attributes.name,
        };
      }),
      isAdmin: config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
      domaineOptions: [
        {
          value: 'ANIMATION',
          label: 'Animation',
        },
        {
          value: 'COACHING',
          label: 'Coaching',
        },
        {
          value: 'DEPLOIEMENT',
          label: 'Déploiement',
        },
        {
          value: 'DESIGN',
          label: 'Design',
        },
        {
          value: 'DEVELOPPEMENT',
          label: 'Développement',
        },
        {
          value: 'INTRAPRENARIAT',
          label: 'Intraprenariat',
        },
        {
          value: 'PRODUIT',
          label: 'Produit',
        },
        {
          value: 'AUTRE',
          label: 'Autre',
        },
      ],
      users,
      activeTab: 'community',
    };
  } catch (err) {
    onError(err);
  }
}

export async function getUserApi(req, res) {
  getUserPageData(
    req,
    res,
    (data) => {
      res.json(data);
    },
    (err) => {
      res.status(500).json({
        error: err,
      });
    }
  );
}

export async function getUser(req, res) {
  getUserPageData(
    req,
    res,
    (data) => {
      res.render('user', data);
    },
    (err) => {
      console.error(err);
      req.flash('error', err);
      res.redirect('/community');
    }
  );
}

async function getUserPageData(req, res, onSuccess, onError) {
  const { username } = req.params;
  const isCurrentUser = req.auth.id === username;

  try {
    if (isCurrentUser) {
      res.redirect('/account');
      return;
    }

    const [user]: [MemberWithPermission] = await Promise.all([
      utils.userInfos(username, isCurrentUser),
    ]);

    const hasGithubFile = user.userInfos;
    const hasEmailAddress = user.emailInfos || user.redirections.length > 0;
    if (!hasGithubFile && !hasEmailAddress) {
      req.flash('error');
      onError(
        'Il n\'y a pas de membres avec ce compte mail. Vous pouvez commencez par créer une fiche sur Github pour la personne <a href="/onboarding">en cliquant ici</a>.'
      );
      return;
    }
    const marrainageStateResponse = await knex('marrainage')
      .select()
      .where({ username });
    const marrainageState = marrainageStateResponse[0];

    const dbUser = await knex('users').where({ username }).first();
    const secondaryEmail = dbUser ? dbUser.secondary_email : '';
    let availableEmailPros = [];
    if (config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id)) {
      availableEmailPros = await betagouv.getAvailableProEmailInfos();
    }
    const title = user.userInfos ? user.userInfos.fullname : null;
    onSuccess({
      title,
      username,
      currentUserId: req.auth.id,
      emailInfos: user.emailInfos,
      redirections: user.redirections,
      userInfos: user.userInfos,
      isExpired: user.isExpired,
      isAdmin: config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
      availableEmailPros,
      primaryEmail: dbUser ? dbUser.primary_email : '',
      primaryEmailStatus: dbUser
        ? EMAIL_STATUS_READABLE_FORMAT[dbUser.primary_email_status]
        : '',
      canCreateEmail: user.canCreateEmail,
      hasPublicServiceEmail:
        dbUser &&
        dbUser.primary_email &&
        !dbUser.primary_email.includes(config.domain),
      errors: req.flash('error'),
      messages: req.flash('message'),
      domain: config.domain,
      marrainageState,
      activeTab: 'community',
      secondaryEmail,
    });
  } catch (err) {
    onError(err);
  }
}
