

export enum MARRAINAGE_EVENT {
    MARRAINAGE_IS_DOING_EVENT='MarrainageIsDoingEvent'
}

export const MARRAINAGE_EVENTS_VALUES = Object.keys(MARRAINAGE_EVENT).filter((item) => {
    return isNaN(Number(item));
});