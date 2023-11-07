import * as utils from '@controllers/utils';
import knex from '@/db/index';
import { addEvent, EventCode } from '@/lib/events';
import config from '@/config';

export async function manageSecondaryEmailForUserApi(req, res) {
  manageSecondaryEmailForUserHandler(
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

export async function manageSecondaryEmailForUser(req, res) {
  const { username } = req.params;
  manageSecondaryEmailForUserHandler(
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

export async function manageSecondaryEmailForUserHandler(
  req,
  res,
  onSuccess,
  onError
) {
  const { username } = req.params;
  const isCurrentUser = req.auth.id === username;
  const { secondaryEmail } = req.body;
  const user = await utils.userInfos(username, isCurrentUser);

  try {
    if (
      user.canChangeEmails ||
      config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id)
    ) {
      const dbUser = await knex('users')
        .where({
          username,
        })
        .then((db) => db[0]);
      await knex('users')
        .insert({
          secondary_email: secondaryEmail,
          username,
        })
        .onConflict('username')
        .merge({
          secondary_email: secondaryEmail,
          username,
        });
      addEvent(EventCode.MEMBER_SECONDARY_EMAIL_UPDATED, {
        created_by_username: req.auth.id,
        action_on_username: username,
        action_metadata: {
          value: secondaryEmail,
          old_value: dbUser ? dbUser.secondary_email : null,
        },
      });
      req.flash('message', 'Ton compte email secondaire a bien mis à jour.');
      console.log(`${req.auth.id} a mis à jour son adresse mail secondaire.`);
      onSuccess();
    }
  } catch (err) {
    console.error(err);
    req.flash('error', err.message);
    onError();
  }
}
