import { sendCampaignEmail } from "@/config/email.config";
import { MAILING_LIST_TYPE } from "@/modules/email";

sendCampaignEmail({
    type: MAILING_LIST_TYPE.TEST,
    variables: undefined,
    campaignName: "TEST",
    subject: "TEST",
    htmlContent: '<h1>This is a test</h1><a href="{{ unsubscribe }}">Click here to unsubscribe</a>'
})
