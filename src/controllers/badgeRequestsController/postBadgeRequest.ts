import {
  createBadgeRequest,
  getBadgeRequestWithStatus,
} from '@/db/dbBadgeRequests';
import { BadgeRequest, BADGE_REQUEST } from '@/models/badgeRequests';
import DS from '@/config/ds/ds.config';
import config from '@/config';
import { MemberWithPermission } from '@/models/member';
import { capitalizeWords, userInfos } from '../utils';
import { BadgeDossier } from '@/models/badgeDemande';

const buildRequestId = () => {
  return '';
};

const computeStartDate = () => {
  const date = new Date();
  const minimalDelay = 14; // badge can be issue min 2 weeks after demande
  date.setDate(date.getDate() + minimalDelay);
  date.toISOString().split('T')[0];
  return date;
};

export async function postBadgeRequest(req, res) {
  const [currentUser]: [MemberWithPermission] = await Promise.all([
    (async () => userInfos(req.auth.id, true))(),
  ]);
  const endDate = currentUser.userInfos.end;
  const startDate = computeStartDate();

  let badgeRequest: BadgeRequest = await getBadgeRequestWithStatus(
    req.auth.id,
    BADGE_REQUEST.BADGE_REQUEST_PENDING
  );
  let isRequestPending = false;
  if (badgeRequest) {
    try {
      let dossier: BadgeDossier = (await DS.getDossierForDemarche(
        badgeRequest.dossier_number
      )) as unknown as BadgeDossier;

      if (
        ['en_construction', 'en_instruction', 'prefilled'].includes(
          dossier.state
        )
      ) {
        isRequestPending = true;
      }
    } catch (e) {
      // dossier is no filled yet
    }
  }
  if (!isRequestPending) {
    try {
      const names = req.auth.id.split('.');
      const firstname = capitalizeWords(names.shift());
      const lastname = names.map((name) => capitalizeWords(name)).join(' ');
      let dossier = (await DS.createPrefillDossier(config.DS_DEMARCHE_NUMBER, {
        champ_Q2hhbXAtNjYxNzM5: firstname,
        champ_Q2hhbXAtNjYxNzM3: lastname,
        identite_prenom: firstname,
        identite_nom: lastname,
        champ_Q2hhbXAtNjYxNzM4: currentUser.userInfos.employer
          ? currentUser.userInfos.employer.split('/')[1]
          : '',
        champ_Q2hhbXAtNjcxODAy: endDate,
        champ_Q2hhbXAtMzE0MzkxNA: [
          'Locaux SEGUR 5.413, 5.416, 5.420, 5.425, 5.424, 5.428 et cantine',
        ],
        // "champ_Q2hhbXAtMzE0MzkxNA":["Locaux SEGUR 5.413, 5.416, 5.420, 5.425, 5.424, 5.428 et cantine","Parking"],
        // "champ_Q2hhbXAtMzE4MjQ0Ng":"Texte court",
        // "champ_Q2hhbXAtMzE4MjQ0Nw":"true",
        // "champ_Q2hhbXAtMzE4MjQ0Mw":"Locaux SEGUR 5.413, 5.416, 5.420, 5.425, 5.424, 5.428 et cantine"
      })) as unknown as {
        dossier_number: number;
        dossier_url: string;
        dossier_prefill_token: string;
      };
      if (dossier && typeof dossier.dossier_number) {
        let dossier_number = dossier.dossier_number;
        badgeRequest = await createBadgeRequest({
          username: req.auth.id,
          status: BADGE_REQUEST.BADGE_REQUEST_PENDING,
          start_date: startDate,
          end_date: new Date(endDate),
          dossier_number,
          request_id: buildRequestId(),
          ds_token: dossier.dossier_prefill_token,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }
  return res.status(200).json({
    request_id: badgeRequest.request_id,
    dossier_token: badgeRequest.ds_token,
    dossier_number: badgeRequest.dossier_number,
  });
}
