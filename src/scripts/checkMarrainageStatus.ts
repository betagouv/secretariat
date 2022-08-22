import EventBus from "@infra/eventBus/eventBus";
import { checkMarrainageStatus } from "@schedulers/marrainageScheduler";

checkMarrainageStatus(EventBus).then(() => {
    console.log('Done')
})