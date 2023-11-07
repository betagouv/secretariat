import * as utils from '@controllers/utils';
import knex from '@/db/index';
import * as mattermost from '@/lib/mattermost';
import { addEvent, EventCode } from '@/lib/events';
import { MemberWithPermission } from '@models/member';
import { DBUser } from '@/models/dbUser/dbUser';
import betagouv from '@/betagouv';
import config from '@/config';

export async function managePrimaryEmailForUserApi(req, res) {
  const { username } = req.params;
  managePrimaryEmailForUserHandler(
    req,
    res,
    () => {
      res.json({
        success: true,
      });
    },
    () => {
      res.status(500).json({
        error: req.flash('error'),
      });
    }
  );
}

export async function managePrimaryEmailForUser(req, res) {
  const { username } = req.params;
  managePrimaryEmailForUserHandler(
    req,
    res,
    () => {
      res.redirect(`/community/${username}`);
    },
    () => {
      res.redirect(`/community/${username}`);
    }
  );
}

export async function managePrimaryEmailForUserHandler(
  req,
  res,
  onSuccess,
  onError
) {
  const { username } = req.params;
  const isCurrentUser = req.auth.id === username;
  const { primaryEmail } = req.body;
  const user: MemberWithPermission = await utils.userInfos(
    username,
    isCurrentUser
  );
  try {
    if (!user.canChangeEmails) {
      throw new Error(
        `L'utilisateur n'est pas autorisé à changer l'email primaire`
      );
    }
    const isPublicServiceEmail = await utils.isPublicServiceEmail(primaryEmail);
    if (!isPublicServiceEmail) {
      throw new Error(`L'email renseigné n'est pas un email de service public`);
    }

    const dbUser: DBUser = await knex('users')
      .where({
        username,
      })
      .then((db) => db[0]);
    if (dbUser.primary_email.includes(config.domain)) {
      await betagouv.createRedirection(
        dbUser.primary_email,
        primaryEmail,
        false
      );
      await betagouv.deleteEmail(dbUser.primary_email.split('@')[0]);
    } else {
      try {
        await mattermost.getUserByEmail(primaryEmail);
      } catch {
        throw new Error(
          `L'email n'existe pas dans mattermost, pour utiliser cette adresse comme adresse principale ton compte mattermost doit aussi utiliser cette adresse.`
        );
      }
    }
    await knex('users')
      .insert({
        primary_email: primaryEmail,
        username,
      })
      .onConflict('username')
      .merge({
        primary_email: primaryEmail,
        username,
      });
    addEvent(EventCode.MEMBER_PRIMARY_EMAIL_UPDATED, {
      created_by_username: req.auth.id,
      action_on_username: username,
      action_metadata: {
        value: primaryEmail,
        old_value: dbUser ? dbUser.primary_email : null,
      },
    });
    req.flash('message', 'Ton compte email primaire a bien été mis à jour.');
    console.log(`${req.auth.id} a mis à jour son adresse mail primaire.`);
    onSuccess();
  } catch (err) {
    console.error(err);
    req.flash('error', err.message);
    onError();
  }
}
