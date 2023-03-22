import { createBadgeRequest, getBadgeRequest } from "@/db/dbBadgeRequests";
import { BadgeRequest, BADGE_REQUEST } from "@/models/badgeRequests";
import DS from "@/config/ds/ds.config";
import config from "@/config";
import { MemberWithPermission } from "@/models/member";
import { userInfos } from "../utils";

const buildRequestId = () => {
    return ''
}

const computeStartDate = () => {
    const date = new Date()
    const minimalDelay = 14 // badge can be issue min 2 weeks after demande
    date.setDate(date.getDate() + minimalDelay)
    date.toISOString().split('T')[0]
    return date
}

export async function postBadgeRequest(req, res) {
    const [currentUser] : [MemberWithPermission] = await Promise.all([
        (async () => userInfos(req.auth.id, true))()
    ]);
    const endDate = currentUser.userInfos.end
    const startDate = computeStartDate()

    let badgeRequest : BadgeRequest = await getBadgeRequest(req.auth.id)

    if (!badgeRequest) {
        try {
            let dossier = await DS.createPrefillDossier(config.DS_DEMARCHE_NUMBER, {
                firsname: req.auth.id.split('.')[0],
                lastname: req.auth.id.split('.')[1],
                date: endDate,
                attributaire: 'Octo',
            }) as unknown as { dossier_number: number, dossier_url: string, dossier_prefill_token: string }
            if (dossier && typeof dossier.dossier_number) {
                let dossier_number = dossier.dossier_number
                badgeRequest = await createBadgeRequest({
                    username: req.auth.id,
                    status: BADGE_REQUEST.BADGE_REQUEST_PENDING,
                    start_date: startDate,
                    end_date: new Date(endDate),
                    dossier_number,
                    request_id: buildRequestId(),
                    ds_token: dossier.dossier_prefill_token
                })
            }
        } catch(e) {
            console.log(e)
        }
    }
    return res.status(200).json({
        request_id: badgeRequest.request_id,
        dossier_token: badgeRequest.ds_token,
        dossier_number: badgeRequest.dossier_number
    })
}
