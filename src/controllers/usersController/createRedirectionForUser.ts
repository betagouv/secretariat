import config from "@config";
import BetaGouv from "@/betagouv";
import * as utils from "@controllers/utils";
import { addEvent, EventCode } from '@/lib/events'

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
