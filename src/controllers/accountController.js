import config from "../config";
import * as utils from "./utils";
import knex from "../db";

export async function getCurrentAccount(req, res) {
  try {
    const [currentUser, marrainageState, secondaryEmail] = await Promise.all([
      (async () => utils.userInfos(req.user.id, true))(),
      (async () => {
        const [state] = await knex('marrainage').where({ username: req.user.id });
        return state;
      })(),
      (async () => {
        const rows = await knex('users').where({ username: req.user.id });
        return rows.length === 1 ? rows[0].secondary_email : null;
      })(),
    ]);

    const title = 'Mon compte';
    return res.render('account', {
      title,
      currentUserId: req.user.id,
      emailInfos: currentUser.emailInfos,
      userInfos: currentUser.userInfos,
      domain: config.domain,
      isExpired: currentUser.isExpired,
      canCreateEmail: currentUser.canCreateEmail,
      canCreateRedirection: currentUser.canCreateRedirection,
      canChangePassword: currentUser.canChangePassword,
      canChangeSecondaryEmail: currentUser.canChangeSecondaryEmail,
      redirections: currentUser.redirections,
      secondaryEmail,
      activeTab: 'account',
      marrainageState,
      errors: req.flash('error'),
      messages: req.flash('message'),
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Impossible de récupérer vos informations.');
    return res.redirect('/');
  }
}
