import config from "@config";
import * as utils from "@controllers/utils";
import { MemberWithPermission } from "@models/member";
import { BadgePage } from "@/views";
import DS from "@/config/ds/ds.config";
import { BadgeDossier } from "@/models/badgeDemande";
import { BadgeRequest } from "@/models/badgeRequests";
import { getBadgeRequest } from "@/db/dbBadgeRequests";
import db from "@/db";
import { DBUser } from "@/models/dbUser";

export async function getBadgePage(req, res) {
    try {
      const [currentUser, dbUser] : [MemberWithPermission, DBUser] = await Promise.all([
        (async () => utils.userInfos(req.auth.id, true))(),
        db('users').where({ username: req.auth.id }).first()
      ]);
      // const dossiers = await DS.getAllDossiersForDemarche(config.DS_DEMARCHE_NUMBER)
      let badgeRequest : BadgeRequest = await getBadgeRequest(req.auth.id)
      let dossier
      if (badgeRequest) {
        try {
          dossier = await DS.getDossierForDemarche(badgeRequest.dossier_number) as unknown as BadgeDossier
        } catch(e) {
          // dossier is no filled yet
        }
      }
      const title = 'Demande de badge';
      res.send(
        BadgePage({
          title,
          dossier,
          currentUserId: req.auth.id,
          primaryEmail: dbUser.primary_email,
          firstName: currentUser.userInfos.fullname.split(' ')[0],
          lastName: currentUser.userInfos.fullname.split(' ')[1].toUpperCase(),
          attributaire: currentUser.userInfos.employer.split('/')[1],
          endDate: currentUser.userInfos.end,
          domain: config.domain,
          isExpired: currentUser.isExpired,
          badgeRequest,
          subActiveTab: 'badge',
          activeTab: 'account',
          isAdmin: config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
          errors: req.flash('error'),
          request: req,
          messages: req.flash('message'),
      }))
    } catch (err) {
      console.error(err);
      req.flash('error', 'Impossible de récupérer vos informations.');
      return res.redirect('/');
    }
  }
