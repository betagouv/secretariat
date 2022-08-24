import ejs from "ejs";
import crypto from "crypto";
import config from "@config";
import BetaGouv from "@/betagouv";
import * as utils from "./utils";
import knex from "@/db/index";
import * as mattermost from "@/lib/mattermost"
import { addEvent, EventCode } from '@/lib/events'
import { MemberWithPermission } from "@models/member";
import { DBUser, EmailStatusCode } from "@models/dbUser";
import { EMAIL_TYPES } from "@/modules/email";
import { sendEmail } from "@/config/email.config";

export async function createEmail(username, creator) {
  const email = utils.buildBetaEmail(username);
  const password = crypto.randomBytes(16)
    .toString('base64')
    .slice(0, -2);

  const secretariatUrl = `${config.protocol}://${config.host}`;

  const message = `À la demande de ${creator} sur <${secretariatUrl}>, je crée un compte mail pour ${username}`;

  await BetaGouv.sendInfoToChat(message);
  await BetaGouv.createEmail(username, password);
  await knex('users').where({
    username,
  }).update({
    primary_email: email,
    primary_email_status: EmailStatusCode.EMAIL_CREATION_PENDING,
    primary_email_status_updated_at: new Date()
  })

  addEvent(EventCode.MEMBER_EMAIL_CREATED, {
    created_by_username: creator,
    action_on_username: username,
    action_metadata: {
      value: email
    }
  })
  console.log(
    `Création de compte by=${creator}&email=${email}`,
  );
}

export async function setEmailActive(username) {  
  const [ user ] : DBUser[] = await knex('users').where({
    username,
  })
  const shouldSendEmailCreatedEmail = user.primary_email_status === EmailStatusCode.EMAIL_CREATION_PENDING
  await knex('users').where({
    username,
  }).update({
    primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
    primary_email_status_updated_at: new Date()
  })
  await knex('user_details').where({
    hash: utils.computeHash(username)
  }).update({
    active: true
  })
  console.log(
    `Email actif pour ${user.username}`,
  );
  if (shouldSendEmailCreatedEmail) {
    await sendEmailCreatedEmail(username)
  }
}

export async function setEmailSuspended(username) {  
  const [ user ] : DBUser[] = await knex('users').where({
    username,
  }).update({
    primary_email_status: EmailStatusCode.EMAIL_SUSPENDED,
    primary_email_status_updated_at: new Date()
  }).returning('*')
  console.log(
    `Email suspendu pour ${user.username}`,
  );
}

export async function sendEmailCreatedEmail(username) {
  const [user] : DBUser[] = await knex('users').where({
    username,
  })
  const secretariatUrl = `${config.protocol}://${config.host}`;

  try {
    await sendEmail({
      type: EMAIL_TYPES.EMAIL_CREATED_EMAIL,
      toEmail: [user.secondary_email],
      variables: {
        email: user.primary_email,
        secondaryEmail: user.secondary_email,
        secretariatUrl,
        mattermostInvitationLink: config.mattermostInvitationLink,
      }
    })
    console.log(
      `Email de bienvenue pour ${user.username} envoyé`,
    );
  } catch (err) {
    throw new Error(`Erreur d'envoi de mail à l'adresse indiqué ${err}`);
  }
}

async function updateSecondaryEmail(username, secondary_email) {
  return knex('users').where({
    username
  }).update({
    secondary_email
  })
}

export async function createEmailForUser(req, res) {
  const username = req.sanitize(req.params.username);
  const isCurrentUser = req.auth.id === username;

  try {
    const [user, dbUser] : [MemberWithPermission, DBUser] = await Promise.all([
      utils.userInfos(username, isCurrentUser),
      knex('users').where({ username }).first()
    ]);

    if (!user.userInfos) {
      throw new Error(
        `Le membre ${username} n'a pas de fiche sur Github : vous ne pouvez pas créer son compte email.`,
      );
    }

    if (user.isExpired) {
      throw new Error(
        `Le compte du membre ${username} est expiré.`,
      );
    }

    if (!user.canCreateEmail) {
      throw new Error('Vous n\'avez pas le droit de créer le compte email du membre.');
    }

    const hasPublicServiceEmail = dbUser.primary_email && !dbUser.primary_email.includes(config.domain)
    if (hasPublicServiceEmail) {
      throw new Error(`Le membre a déjà un email principal autre que ${config.domain}`);
    }

    if (!isCurrentUser) {
      const loggedUserInfo = await BetaGouv.userInfosById(req.auth.id);
      if (utils.checkUserIsExpired(loggedUserInfo)) {
        throw new Error('Vous ne pouvez pas créer le compte email car votre compte a une date de fin expiré sur Github.');
      }
    }
    await updateSecondaryEmail(username, req.body.to_email)
    await createEmail(username, req.auth.id);

    req.flash('message', 'Le compte email a bien été créé.');
    res.redirect(`/community/${username}`);
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    res.redirect('/community');
  }
}

export async function createRedirectionForUser(req, res) {
  const { username } = req.params;
  const isCurrentUser = req.auth.id === username;

  try {
    const user = await utils.userInfos(username, isCurrentUser);

    // TODO: généraliser ce code dans un `app.param("id")` ?
    if (!user.userInfos) {
      throw new Error(
        `Le membre ${username} n'a pas de fiche sur Github : vous ne pouvez pas créer de redirection.`,
      );
    }

    if (user.isExpired) {
      throw new Error(
        `Le compte du membre ${username} est expiré.`,
      );
    }

    if (!user.canCreateRedirection) {
      throw new Error('Vous n\'avez pas le droit de créer de redirection.');
    }

    console.log(
      `Création d'une redirection d'email id=${req.auth.id}&from_email=${username}&to_email=${req.body.to_email}&keep_copy=${req.body.keep_copy}`,
    );

    const secretariatUrl = `${config.protocol}://${req.get('host')}`;

    const message = `À la demande de ${req.auth.id} sur <${secretariatUrl}>, je crée une redirection mail pour ${username}`;

    try {
      addEvent(EventCode.MEMBER_REDIRECTION_CREATED, {
        created_by_username: req.auth.id,
        action_on_username: username,
        action_metadata: {
          value: req.body.to_email
        }
      })
      await BetaGouv.sendInfoToChat(message);
      await BetaGouv.createRedirection(
        utils.buildBetaEmail(username),
        req.body.to_email,
        req.body.keep_copy === 'true',
      );
    } catch (err) {
      throw new Error(`Erreur pour créer la redirection: ${err}`);
    }
    req.flash('message', 'La redirection a bien été créé.');
    if (isCurrentUser) {
      res.redirect('/account')
    } else {
      res.redirect(`/community/${username}`);
    }
  } catch (err) {
    console.error(err);
    req.flash('error', err.message);
    if (isCurrentUser) {
      res.redirect('/account')
    } else {
      res.redirect(`/community/${username}`);
    }
  }
}

export async function deleteRedirectionForUser(req, res) {
  const {
    username,
    email: toEmail,
  } = req.params;
  const isCurrentUser = req.auth.id === username;

  try {
    const user = await utils.userInfos(username, isCurrentUser);
    // TODO: vérifier si le membre existe sur Github ?

    if (!user.canCreateRedirection) {
      throw new Error('Vous n\'avez pas le droit de supprimer cette redirection.');
    }

    console.log(`Suppression de la redirection by=${username}&to_email=${toEmail}`);

    const secretariatUrl = `${config.protocol}://${req.get('host')}`;

    const message = `À la demande de ${req.auth.id} sur <${secretariatUrl}>, je supprime la redirection mail de ${username} vers ${toEmail}`;

    try {
      addEvent(EventCode.MEMBER_REDIRECTION_DELETED, {
        created_by_username: req.auth.id,
        action_on_username: username,
        action_metadata: {
          value: toEmail
        }
      })
      await BetaGouv.sendInfoToChat(message);
      await BetaGouv.deleteRedirection(utils.buildBetaEmail(username), toEmail);
    } catch (err) {
      throw new Error(`Erreur pour supprimer la redirection: ${err}`);
    }

    req.flash('message', 'La redirection a bien été supprimée.');
    res.redirect(`/community/${username}`);
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    res.redirect(`/community/${username}`);
  }
}

export async function updatePasswordForUser(req, res) {
  const { username } = req.params;
  const isCurrentUser = req.auth.id === username;
  try {
    const user = await utils.userInfos(username, isCurrentUser);

    if (!user.userInfos) {
      throw new Error(
        `Le membre ${username} n'a pas de fiche sur Github : vous ne pouvez pas modifier le mot de passe.`,
      );
    }

    if (user.isExpired) {
      throw new Error(
        `Le compte du membre ${username} est expiré.`,
      );
    }

    if (!user.canChangePassword) {
      throw new Error('Vous n\'avez pas le droit de changer le mot de passe.');
    }

    const password = req.body.new_password;

    if (
      !password
      || password.length < 9
      || password.length > 30
      || password !== password.trim()
    ) {
      throw new Error(
        'Le mot de passe doit comporter de 9 à 30 caractères, ne pas contenir d\'accents ni d\'espace au début ou à la fin.',
      );
    }
    const dbUser: DBUser = await knex('users').where({ username }).first()
    const email = utils.buildBetaEmail(username);

    console.log(`Changement de mot de passe by=${req.auth.id}&email=${email}`);

    const secretariatUrl = `${config.protocol}://${req.get('host')}`;

    await BetaGouv.changePassword(username, password);
    await addEvent(EventCode.MEMBER_PASSWORD_UPDATED, {
      created_by_username: req.auth.id,
      action_on_username: username
    })
    if (dbUser.primary_email_status === EmailStatusCode.EMAIL_SUSPENDED) {
      await knex('users').where({ username }).update({
        primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
        primary_email_status_updated_at: new Date()
      })
      await knex('user_details').where({ hash: utils.computeHash(username )}).update({
        active: true
      })
    }
    const message = `À la demande de ${req.auth.id} sur <${secretariatUrl}>, je change le mot de passe pour ${username}.`;
    await BetaGouv.sendInfoToChat(message);
    req.flash('message', 'Le mot de passe a bien été modifié.');
    res.redirect(`/community/${username}`);
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    res.redirect(`/community/${username}`);
  }
}

export async function deleteEmailForUser(req, res) {
  const { username } = req.params;
  const isCurrentUser = req.auth.id === username;

  try {
    const user = await utils.userInfos(username, isCurrentUser);

    if (!isCurrentUser && !user.isExpired) {
      throw new Error(
        `Le compte "${username}" n'est pas expiré, vous ne pouvez pas supprimer ce compte.`,
      );
    }

    await BetaGouv.sendInfoToChat(`Suppression de compte de ${username} (à la demande de ${req.auth.id})`);
    addEvent(EventCode.MEMBER_EMAIL_DELETED, {
      created_by_username: req.auth.id,
      action_on_username: username
    })
    if (user.redirections && user.redirections.length > 0) {
      await BetaGouv.requestRedirections('DELETE', user.redirections.map((x) => x.id));
      console.log(`Suppression des redirections de l'email de ${username} (à la demande de ${req.auth.id})`);
    }

    await BetaGouv.createRedirection(utils.buildBetaEmail(username), config.leavesEmail, false);
    await knex('users')
      .update({ secondary_email: null })
      .where({ username });
    console.log(`Redirection des emails de ${username} vers ${config.leavesEmail} (à la demande de ${req.auth.id})`);

    if (isCurrentUser) {
      res.clearCookie('token');
      req.flash('message', 'Ton compte email a bien été supprimé.');
      res.redirect('/login');
    } else {
      req.flash('message', `Le compte email de ${username} a bien été supprimé.`);
      res.redirect(`/community/${username}`);
    }
  } catch (err) {
    console.error(err);
    req.flash('error', err.message);
    res.redirect(`/community/${username}`);
  }
}

export async function managePrimaryEmailForUser(req, res) {
  const { username } = req.params;
  const isCurrentUser = req.auth.id === username;
  const { primaryEmail } = req.body;
  const user : MemberWithPermission = await utils.userInfos(username, isCurrentUser);
  try {
    if (!user.canChangeEmails) {
      throw new Error(`L'utilisateur n'est pas autorisé à changer l'email primaire`);
    }
    const isPublicServiceEmail = await utils.isPublicServiceEmail(primaryEmail)
    if (!isPublicServiceEmail) {
      throw new Error(`L'email renseigné n'est pas un email de service public`);
    }
    try {
      await mattermost.getUserByEmail(primaryEmail)
    } catch {
      throw new Error(`L'email n'existe pas dans mattermost, pour utiliser cette adresse comme adresse principale ton compte mattermost doit aussi utiliser cette adresse.`);
    }
    const dbUser: DBUser = await knex('users').where({
      username,
    }).then(db => db[0])
    await knex('users')
    .insert({
      primary_email: primaryEmail,
      username
    })
    .onConflict('username')
    .merge({
      primary_email: primaryEmail,
      username
    });
    addEvent(EventCode.MEMBER_PRIMARY_EMAIL_UPDATED, {
      created_by_username: req.auth.id,
      action_on_username: username,
      action_metadata: {
        value: primaryEmail,
        old_value: dbUser ? dbUser.primary_email : null,
      }
    })
    req.flash('message', 'Ton compte email primaire a bien été mis à jour.');
    console.log(`${req.auth.id} a mis à jour son adresse mail primaire.`);
    res.redirect(`/community/${username}`);
  } catch (err) {
    console.error(err);
    req.flash('error', err.message);
    res.redirect(`/community/${username}`);
  }
}

export async function manageSecondaryEmailForUser(req, res) {
  const { username } = req.params;
  const isCurrentUser = req.auth.id === username;
  const { secondaryEmail } = req.body;
  const user = await utils.userInfos(username, isCurrentUser);

  try {
    if (user.canChangeEmails) {
      const dbUser = await knex('users').where({
        username,
      }).then(db => db[0])
      await knex('users')
      .insert({
        secondary_email: secondaryEmail,
        username
      })
      .onConflict('username')
      .merge({
        secondary_email: secondaryEmail,
        username
      });
      addEvent(EventCode.MEMBER_SECONDARY_EMAIL_UPDATED, {
        created_by_username: req.auth.id,
        action_on_username: username,
        action_metadata: {
          value: secondaryEmail,
          old_value: dbUser ? dbUser.secondary_email : null,
        }
      })
      req.flash('message', 'Ton compte email secondaire a bien mis à jour.');
      console.log(`${req.auth.id} a mis à jour son adresse mail secondaire.`);
      res.redirect(`/community/${username}`);
    };
  } catch (err) {
    console.error(err);
    req.flash('error', err.message);
    res.redirect(`/community/${username}`);
  }
}

function createBranchName(username) {
  const refRegex = /( |\.|\\|~|^|:|\?|\*|\[)/gm;
  const randomSuffix = crypto.randomBytes(3).toString('hex');
  return `author${username.replace(refRegex, '-')}-update-end-date-${randomSuffix}`;
}

async function updateAuthorGithubFile(username, changes) {
  const branch = createBranchName(username);
  const path = `content/_authors/${username}.md`;
  console.log(`Début de la mise à jour de la fiche pour ${username}...`);

  await utils.getGithubMasterSha()
    .then((response) => {
      const { sha } = response.data.object;
      console.log('SHA du master obtenu');
      return utils.createGithubBranch(sha, branch);
    })
    .then(() => {
      console.log(`Branche ${branch} créée`);
      return utils.getGithubFile(path, branch);
    })
    .then((res) => {
      let content = Buffer.from(res.data.content, 'base64').toString('utf-8');
      changes.forEach((change) => {
        // replace old keys by new keys
        content = content.replace(`${change.key}: ${change.old}`, `${change.key}: ${change.new}`);
      });
      return utils.createGithubFile(path, branch, content, res.data.sha);
    })
    .then(() => {
      console.log(`Fiche Github pour ${username} mise à jour dans la branche ${branch}`);
      return utils.makeGithubPullRequest(branch, `Mise à jour de la date de fin pour ${username}`);
    })
    .then(() => {
      console.log(`Pull request pour la mise à jour de la fiche de ${username} ouverte`);
    })
    .catch((err) => {
      console.log(err);
      throw new Error(`Erreur Github lors de la mise à jour de la fiche de ${username}`);
    });
}

export async function updateEndDateForUser(req, res) {
  const { username } = req.params;

  try {
    const formValidationErrors = [];

    function requiredError(field) {
      formValidationErrors.push(`${field} : le champ n'est pas renseigné`);
    }

    function isValidDate(field, date) {
      if (date instanceof Date && !Number.isNaN(date.getTime())) {
        return date;
      }
      formValidationErrors.push(`${field} : la date n'est pas valide`);
      return null;
    }

    const { start, end } = req.body;
    const newEnd = req.body.newEnd || requiredError('nouvelle date de fin');

    const startDate = new Date(start);
    const newEndDate = isValidDate('nouvelle date de fin', new Date(newEnd));

    if (startDate && newEndDate) {
      if (newEndDate < startDate) {
        formValidationErrors.push('nouvelle date de fin : la date doit être supérieure à la date de début');
      }
    }

    if (formValidationErrors.length) {
      req.flash('error', formValidationErrors);
      throw new Error();
    }

    const changes = [{ key: 'end', old: end, new: newEnd }];
    await updateAuthorGithubFile(username, changes);
    addEvent(EventCode.MEMBER_END_DATE_UPDATED, {
      created_by_username: req.auth.id,
      action_on_username: username,
      action_metadata: {
        value: newEnd,
        old_value: end,
      }
    })
    // TODO: get actual PR url instead
    const pullRequestsUrl = `https://github.com/${config.githubRepository}/pulls`;
    req.flash('message', `Pull request pour la mise à jour de la fiche de ${username} ouverte <a href="${pullRequestsUrl}" target="_blank">ici</a>. Une fois mergée, votre profil sera mis à jour.`);
    res.redirect(`/community/${username}`);
  } catch (err) {
    console.error(err);
    req.flash('error', err.message);
    res.redirect(`/community/${username}`);
  }
};
