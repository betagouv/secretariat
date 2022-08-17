import { MARRAINAGE_EVENT } from "../../models/marrainage";
import EventBus from "../../infra/eventBus/eventBus";
import { onMarrainageSendNewcomerEmail, onMarrainageSendOnboarderEmail } from "./eventHandlers";

export const ConsumeEmailEvent = () => {
    EventBus.consume(MARRAINAGE_EVENT.MARRAINAGE_SEND_NEWCOMER_EMAIL, onMarrainageSendNewcomerEmail)
    EventBus.consume(MARRAINAGE_EVENT.MARRAINAGE_SEND_ONBOARDER_EMAIL, onMarrainageSendOnboarderEmail)
}
