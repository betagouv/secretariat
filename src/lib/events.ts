import knex from "../db";

export enum EventCode {
    CREATE_REDIRECTION,
    DELETE_REDIRECTION,
    CREATE_EMAIL,
    CHANGE_PASSWORD,
    SET_RESPONDER,
    UPDATE_RESPONDER,
    DELETE_RESPONDER,
    CREATE_MARRAINAGE,
    ACCEPT_MARRAINAGE,
    DECLINE_MARRAINAGE,
}

const EventDescriptions = new Map<EventCode, string>([
    [EventCode.CREATE_REDIRECTION, `redirection créée`],
    [EventCode.DELETE_REDIRECTION, 'redirection supprimée'],
    [EventCode.CREATE_EMAIL, `email créé`],
    [EventCode.CHANGE_PASSWORD, `password changé`],
    [EventCode.SET_RESPONDER, `réponse automatique créée`],
    [EventCode.UPDATE_RESPONDER, `réponse automatique mise à jour`],
    [EventCode.DELETE_RESPONDER, `réponse automatique supprimée`],
    [EventCode.CREATE_MARRAINAGE, `marrainage crée`],
    [EventCode.ACCEPT_MARRAINAGE, `marrainage accepté`],
    [EventCode.DECLINE_MARRAINAGE, `marrainage décliné`],
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
