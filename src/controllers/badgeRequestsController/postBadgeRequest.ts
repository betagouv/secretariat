import { createBadgeRequest, getBadgeRequest } from "@/db/dbBadgeRequests";
import { BadgeRequest, BADGE_REQUEST } from "@/models/badgeRequests";

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
    console.log('LCS POST BADGE REQUEST 1')
    const endDate = req.body.endDate
    console.log('LCS POST BADGE REQUEST 2', endDate)
    const startDate = computeStartDate()
    let badgeRequest : BadgeRequest = await getBadgeRequest(req.auth.id)
    console.log('LCS POST BADGE REQUEST 3')
    if (!badgeRequest) {
        console.log('LCS POST BADGE REQUEST 3.1')
        try {
            badgeRequest = await createBadgeRequest({
                username: req.auth.id,
                status: BADGE_REQUEST.BADGE_REQUEST_PENDING,
                start_date: startDate,
                end_date: endDate,
                request_id: buildRequestId(),
            })
        } catch(e) {
            console.log(e)
        }
        console.log('LCS POST BADGE REQUEST 3.2')
    }
    console.log('LCS POST BADGE REQUEST 4')
    return res.json({
        request_id: badgeRequest.request_id
    })
}
