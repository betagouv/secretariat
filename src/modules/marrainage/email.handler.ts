import { MARRAINAGE_EVENT } from "@models/marrainage";
import EventBus from "@infra/eventBus/eventBus";
import { onMarrainageSendNewcomerEmail, onMarrainageSendOnboarderEmail } from "./eventHandlers";
import betagouv from "@/betagouv";
import { Member } from "@/models/member";

export const ConsumeEmailEvent = async () => {
    return Promise.all([
        EventBus.consume(MARRAINAGE_EVENT.MARRAINAGE_SEND_NEWCOMER_EMAIL, onMarrainageSendNewcomerEmail).catch(err => Promise.resolve(err)),
        EventBus.consume(MARRAINAGE_EVENT.MARRAINAGE_SEND_ONBOARDER_EMAIL, onMarrainageSendOnboarderEmail).catch(err => Promise.resolve(err))
    ])
}
