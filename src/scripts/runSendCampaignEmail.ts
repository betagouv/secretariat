import { sendCampaignEmail } from "@/config/email.config";
import { EMAIL_TYPES, MAILING_LIST_TYPE } from "@/modules/email";

sendCampaignEmail({
    mailingListType: MAILING_LIST_TYPE.TEST,
    type: EMAIL_TYPES.EMAIL_TEST,
    variables: undefined,
    campaignName: "TEST",
    subject: "TEST",
    htmlContent: '<h1>This is a test</h1><a href="{{ unsubscribe }}">Click here to unsubscribe</a>'
})
