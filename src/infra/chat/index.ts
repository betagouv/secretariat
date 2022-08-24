import config from "@/config";
import { makeSendIntoToChatFromMattermost } from "./mattermost";

export const sendInfoToChat = makeSendIntoToChatFromMattermost({
    config: {
        WEBHOOK_GENERAL: config.slackWebhookURLGeneral,
        WEBHOOK_SECRETARIAT: config.slackWebhookURLSecretariat
    }
})
