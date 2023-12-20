import { updateBadgeRequest } from '@/db/dbBadgeRequests';
import { BADGE_REQUEST } from '@/models/badgeRequests';

export async function updateBadgeRequestStatus(req, res) {
  await updateBadgeRequest(
    {
      status: BADGE_REQUEST.BADGE_REQUEST_SENT,
    },
    req.auth.id
  );

  return res.json({});
}

export async function updateBadgeRenewalRequestStatus(req, res) {
  await updateBadgeRequest(
    {
      status: BADGE_REQUEST.BADGE_RENEWAL_REQUEST_SENT,
    },
    req.auth.id
  );

  return res.json({});
}
