import config from "@config";
import BetaGouv from "@/betagouv";
import * as utils from "@controllers/utils";
import { addEvent, EventCode } from '@/lib/events'

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
