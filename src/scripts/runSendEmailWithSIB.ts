import { makeSendinblue } from "@/infra/email/sendInBlue";
import { EMAIL_TYPES } from "@/modules/email";

const { sendEmail } = makeSendinblue({
    SIB_APIKEY_PRIVATE: process.env.SIB_APIKEY_PRIVATE,
    MAIL_SENDER: "Lucas TEST",
    htmlBuilder: {
        renderFile: function (url: string, params: any): Promise<string> {
            throw new Error("Function not implemented.");
        },
        templates: undefined
    }
})
sendEmail({
    type: EMAIL_TYPES.MARRAINAGE_NEWCOMER_EMAIL,
    variables: undefined,
    htmlContent: '<h1>This is a test</h1>',
    toEmail: [],
    bcc: ['lucas.charrier@beta.gouv.fr']
})
