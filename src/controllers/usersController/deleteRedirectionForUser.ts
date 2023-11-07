import config from '@config';
import BetaGouv from '@/betagouv';
import * as utils from '@controllers/utils';
import { addEvent, EventCode } from '@/lib/events';

export async function deleteRedirectionForUserApi(req, res) {
  deleteRedirectionForUserHandler(
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

export async function deleteRedirectionForUser(req, res) {
  const { username } = req.params;
  deleteRedirectionForUserHandler(
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

export async function deleteRedirectionForUserHandler(
  req,
  res,
  onSuccess,
  onError
) {
  const { username, email: toEmail } = req.params;
  const isCurrentUser = req.auth.id === username;

  try {
    const user = await utils.userInfos(username, isCurrentUser);
    // TODO: vérifier si le membre existe sur Github ?

    if (!user.canCreateRedirection) {
      throw new Error(
        "Vous n'avez pas le droit de supprimer cette redirection."
      );
    }

    console.log(
      `Suppression de la redirection by=${username}&to_email=${toEmail}`
    );

    const secretariatUrl = `${config.protocol}://${req.get('host')}`;

    const message = `À la demande de ${req.auth.id} sur <${secretariatUrl}>, je supprime la redirection mail de ${username} vers ${toEmail}`;

    try {
      addEvent(EventCode.MEMBER_REDIRECTION_DELETED, {
        created_by_username: req.auth.id,
        action_on_username: username,
        action_metadata: {
          value: toEmail,
        },
      });
      await BetaGouv.sendInfoToChat(message);
      await BetaGouv.deleteRedirection(utils.buildBetaEmail(username), toEmail);
    } catch (err) {
      throw new Error(`Erreur pour supprimer la redirection: ${err}`);
    }

    req.flash('message', 'La redirection a bien été supprimée.');
    onSuccess();
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    onError();
  }
}
