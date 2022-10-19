import { makeSendinblue } from "@/infra/email/sendInBlue";
import { MAILING_LIST_TYPE } from "@/modules/email";

const { sendCampaignEmail } = makeSendinblue({
    SIB_APIKEY_PRIVATE: process.env.SIB_APIKEY_PRIVATE,
    MAIL_SENDER: "espace-membre@beta.gouv.fr",
    htmlBuilder: {
        renderFile: function (url: string, params: any): Promise<string> {
            throw new Error("Function not implemented.");
        },
        templates: undefined
    }
})
sendCampaignEmail({
    type: MAILING_LIST_TYPE.TEST,
    variables: {},
    campaignName: "TEST",
    subject: "TEST",
    htmlContent: '<h1>This is a test</h1><a href="{{ unsubscribe }}">Click here to unsubscribe</a>'
})
