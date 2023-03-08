import config from "@config";
import * as utils from "@controllers/utils";
import { MemberWithPermission } from "@models/member";
import { BadgePage } from "@/views";

export async function getBadgePage(req, res) {
    try {
      const [currentUser] : [MemberWithPermission] = await Promise.all([
        (async () => utils.userInfos(req.auth.id, true))()
      ]);
      const title = 'Demande de badge';
      res.send(
        BadgePage({
          title,
          currentUserId: req.auth.id,
          firstName: currentUser.userInfos.fullname.split(' ')[0],
          lastName: currentUser.userInfos.fullname.split(' ')[1],
          attributaire: currentUser.userInfos.employer.split('/')[1],
          endDate: currentUser.userInfos.end,
          domain: config.domain,
          isExpired: currentUser.isExpired,
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
