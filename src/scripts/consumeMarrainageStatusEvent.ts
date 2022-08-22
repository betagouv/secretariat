import EventBus from "@infra/eventBus/eventBus";
import { comsumeMarrainageStatusEvent } from "@schedulers/marrainageScheduler";

comsumeMarrainageStatusEvent(EventBus).then(() => {
    console.log('Done')
})