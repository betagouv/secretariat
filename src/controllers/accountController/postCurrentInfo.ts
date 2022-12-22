import betagouv from "@/betagouv";
import knex from "@/db";
import * as utils from "@controllers/utils";
import { MemberWithPermission } from "@models/member";
import { statusOptions, genderOptions } from "@/models/dbUser/dbUser";
import { fetchCommuneDetails } from "@lib/searchCommune";

export async function postCurrentInfo(req, res) {
    const formValidationErrors = {};
    const title = 'Mon compte';
    const [currentUser] : [MemberWithPermission] = await Promise.all([
      (async () => utils.userInfos(req.auth.id, true))(),
    ]);
    try {
      const username = req.auth.id
      const gender = req.body.gender
      const workplace_insee_code = req.body.workplace_insee_code
      const osm_city = req.body.osm_city
      const tjm = req.body.tjm || null;
      const legal_status = req.body.legal_status
      const secondary_email = req.body.secondary_email && utils.isValidEmail(formValidationErrors, 'secondary_email', req.body.secondary_email)
      const average_nb_of_days = req.body.average_nb_of_days

      if (legal_status && !statusOptions.map(statusOption => statusOption.key).includes(legal_status)) {
        formValidationErrors['legal_status'] = `Le statut legal n'a pas une valeur autorisé`
      }
      if (gender && !genderOptions.map(genderOption => genderOption.key).includes(gender)) {
        formValidationErrors['gender'] = `Le genre n'a pas une valeur autorisé`
      }
      if (req.body.workplace_insee_code && ! await fetchCommuneDetails(req.body.workplace_insee_code)) {
        formValidationErrors['workplace_insee_code'] = `La lieu de travail principal n'as pas été trouvé`
      }
  
      if (Object.keys(formValidationErrors).length) {
        req.flash('error', 'Un champs du formulaire est invalide ou manquant.');
        throw new Error();
      }
      await knex('users')
        .update({
          gender,
          workplace_insee_code,
          tjm,
          legal_status,
          secondary_email,
          osm_city,
          average_nb_of_days
        })
        .where({ username })
      const hash = utils.computeHash(username)
      await knex('user_details')
        .insert({
          tjm,
          gender,
          hash,
          average_nb_of_days
        })
        .onConflict('hash')
        .merge()
      
      req.flash('message', "Mise à jour")
      res.redirect(`/account/info`);
    } catch (err) {
      if (err.message) {
        req.flash('error', err.message);
      }
      const startups = await betagouv.startupsInfos();
      res.render('info-update', {
        title,
        formValidationErrors,
        currentUserId: req.auth.id,
        startups,
        statusOptions,
        genderOptions,
        currentUser,
        activeTab: 'account',
        communeInfo: req.body.workplace_insee_code ? await fetchCommuneDetails(req.body.workplace_insee_code) : null,
        formData: {
          ...req.body,
        },
        errors: req.flash('error'),
        messages: req.flash('message'),
      });
    }
  }