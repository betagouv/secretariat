import config from "@config";
import knex from "@/db";
import * as utils from "@controllers/utils";
import { addEvent, EventCode } from '@lib/events'
import { MemberWithPermission } from "@models/member";
import { DBUserDetail, DBUser, statusOptions, genderOptions } from "@/models/dbUser/dbUser";
import { EmailStatusCode } from "@/models/dbUser/dbUser";
import { fetchCommuneDetails } from "@lib/searchCommune";

export async function getCurrentAccount(req, res) {
    try {
      const [currentUser, marrainageState, dbUser, dbUserDetail] : [MemberWithPermission, string, DBUser, DBUserDetail] = await Promise.all([
        (async () => utils.userInfos(req.auth.id, true))(),
        (async () => {
          const [state] = await knex('marrainage').where({ username: req.auth.id });
          return state;
        })(),
        (async () => {
          const rows = await knex('users').where({ username: req.auth.id });
          return rows.length === 1 ? rows[0] : null;
        })(),
        (async () => {
          const hash = utils.computeHash(req.auth.id)
          const rows = await knex('user_details').where({ hash });
          return rows.length === 1 ? rows[0] : {};
        })(),
      ]);
      const today = new Date()
      const title = 'Mon compte';
      const hasPublicServiceEmail = dbUser.primary_email && !dbUser.primary_email.includes(config.domain)
      const gender = dbUserDetail.gender || 'NSP'
      return res.render('account', {
        title,
        currentUserId: req.auth.id,
        emailInfos: currentUser.emailInfos,
        userInfos: currentUser.userInfos,
        domain: config.domain,
        isExpired: currentUser.isExpired,
        // can create email if email is not set, or if email is not @beta.gouv.fr email
        canCreateEmail: currentUser.canCreateEmail && !hasPublicServiceEmail,
        canCreateRedirection: currentUser.canCreateRedirection,
        canChangePassword: currentUser.canChangePassword,
        communication_email: dbUser.communication_email,
        emailSuspended: dbUser.primary_email_status === EmailStatusCode.EMAIL_SUSPENDED,
        canChangeEmails: currentUser.canChangeEmails,
        redirections: currentUser.redirections,
        secondaryEmail: dbUser.secondary_email,
        primaryEmail: dbUser.primary_email,
        activeTab: 'account',
        marrainageState,
        tjm: dbUserDetail.tjm ? `${dbUserDetail.tjm} euros` : 'Non renseigné',
        gender: genderOptions.find(opt => opt.key.toLowerCase() === gender.toLowerCase()).name,
        legal_status: dbUser.legal_status ? statusOptions.find(opt => opt.key === dbUser.legal_status).name : 'Non renseigné',
        workplace: dbUser.workplace_insee_code ? await fetchCommuneDetails(dbUser.workplace_insee_code).then(commune => commune.nom) : 'Non renseigné',
        formData: {},
        hasActiveResponder: currentUser.responder && new Date(currentUser.responder.to) >= today && new Date(currentUser.responder.from) <= today,
        hasResponder: Boolean(currentUser.responder),
        responderFormData: currentUser.responder ? { 
          from: new Date(currentUser.responder.from).toISOString().split('T')[0],
          to: new Date(currentUser.responder.to).toISOString().split('T')[0],
          content: currentUser.responder.content
        } : {
          from: new Date().toISOString().split('T')[0],
          to: '',
          content: ''
        },
        errors: req.flash('error'),
        messages: req.flash('message'),
      });
    } catch (err) {
      console.error(err);
      req.flash('error', 'Impossible de récupérer vos informations.');
      return res.redirect('/');
    }
  }
  
  export async function updateCommunicationEmail(req, res) {
    const { communication_email } = req.body;
    const username = req.auth.id
    try {
      const dbUser = await knex('users').where({
        username,
      }).then(db => db[0])
      if (dbUser.primary_email && dbUser.secondary_email) {
        await knex('users')
        .update({
          communication_email
        }).where({
          username
        })
        addEvent(EventCode.MEMBER_COMMUNICATION_EMAIL_UPDATE, {
          created_by_username: req.auth.id,
          action_on_username: username,
          action_metadata: {
            value: communication_email,
            old_value: dbUser ? dbUser.communication_email : null,
          }
        })
        req.flash('message', 'Ton choix d\'email de communication a bien été mis à jour.');
        console.log(`${req.auth.id} a mis à jour son choix d'email de communication.`);
        res.redirect(`/account`);
      };
    } catch (err) {
      console.error(err);
      req.flash('error', err.message);
      res.redirect(`/account`);
    }
  }