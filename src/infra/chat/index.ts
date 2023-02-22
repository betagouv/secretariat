import config from "@/config";
import { makeSendIntoToChatFromMattermost } from "./mattermost";

export const sendInfoToChat = makeSendIntoToChatFromMattermost({
    config: {
        WEBHOOK_GENERAL: config.CHAT_WEBHOOK_URL_GENERAL,
        WEBHOOK_SECRETARIAT: config.CHAT_WEBHOOK_URL_SECRETARIAT,
        WEBHOOK_DINUM_CENTREVILLE: config.CHAT_WEBHOOK_URL_DINUM
    }
})
