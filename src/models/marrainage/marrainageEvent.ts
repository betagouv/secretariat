

export enum MARRAINAGE_EVENT {
    MARRAINAGE_IS_DOING_EVENT='MARRAINAGE_IS_DOING_EVENT',
    MARRAINAGE_SEND_ONBOARDER_EMAIL="MARRAINAGE_SEND_ONBOARDER_EMAIL",
    MARRAINAGE_SEND_NEWCOMER_EMAIL="MARRAINAGE_SEND_NEWCOMER_EMAIL"
}

export const MARRAINAGE_EVENTS_VALUES = Object.keys(MARRAINAGE_EVENT).filter((item) => {
    return isNaN(Number(item));
});


type BaseEvent = {
    user: string
}

export type EventEmailMarrainageOnboarder = {
    type: MARRAINAGE_EVENT.MARRAINAGE_SEND_ONBOARDER_EMAIL,
    marrainage_group_id: number
} & BaseEvent

export type EventEmailMarrainageNewcomer  = {
    type: MARRAINAGE_EVENT.MARRAINAGE_SEND_NEWCOMER_EMAIL,
    marrainage_group_id: number
} & BaseEvent

