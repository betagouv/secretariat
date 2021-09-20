import knex from "../db";

export enum EventCode {
    CREATE_REDIRECTION,
    DELETE_REDIRECTION,
    CREATE_EMAIL,
    DELETE_EMAIL,
    UPDATE_PASSWORD,
    CREATE_RESPONDER,
    UPDATE_RESPONDER,
    DELETE_RESPONDER,
    CREATE_MARRAINAGE,
    ACCEPT_MARRAINAGE,
    DECLINE_MARRAINAGE,
    UPDATE_SECONDARY_EMAIL,
    UPDATE_END_DATE,
}

const EventDescriptions = new Map<EventCode, string>([
    [EventCode.CREATE_REDIRECTION, `redirection créée`],
    [EventCode.DELETE_REDIRECTION, 'redirection supprimée'],
    [EventCode.CREATE_EMAIL, `email créé`],
    [EventCode.DELETE_EMAIL, `email supprimé`],
    [EventCode.CHANGE_PASSWORD, `password changé`],
    [EventCode.CREATE_RESPONDER, `réponse automatique créée`],
    [EventCode.UPDATE_RESPONDER, `réponse automatique mise à jour`],
    [EventCode.DELETE_RESPONDER, `réponse automatique supprimée`],
    [EventCode.CREATE_MARRAINAGE, `marrainage crée`],
    [EventCode.ACCEPT_MARRAINAGE, `marrainage accepté`],
    [EventCode.DECLINE_MARRAINAGE, `marrainage décliné`],
    [EventCode.UPDATE_SECONDARY_EMAIL, `email secondaire mis à jour`],
    [EventCode.UPDATE_END_DATE, `date de fin mise à jour`],
]);

interface Event {
    action_code: EventCode,
    action_description: string,
    action_on_username: string,
    created_by_username: string
}

export type EventParam = {
    action_on_username?: string,
    created_by_username: string
}

export async function addEvent (eventCode: EventCode, param: EventParam) : Promise<void> {
    const event: Event = {
        action_code: eventCode,
        action_description: EventDescriptions.get(eventCode),
        action_on_username: param.action_on_username,
        created_by_username: param.created_by_username
    }
    return knex('events').insert(event)
}
