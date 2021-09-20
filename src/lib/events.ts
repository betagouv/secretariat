import knex from "../db";

export enum EventCode {
    CREATE_REDIRECTION,
    DELETE_REDIRECTION,
    CREATE_EMAIL,
    CHANGE_PASSWORD,
    SET_RESPONDER,
    UPDATE_RESPONDER,
    DELETE_RESPONDER,
}

const EventDescriptions = new Map<EventCode, string>([
    [EventCode.CREATE_REDIRECTION, `création d'une redirection`],
    [EventCode.DELETE_REDIRECTION, 'suppression de redirection'],
    [EventCode.CREATE_EMAIL, `creation de l'email`],
    [EventCode.CHANGE_PASSWORD, `changement de password`],
    [EventCode.SET_RESPONDER, `création d'une réponse automatique`],
    [EventCode.UPDATE_RESPONDER, `mise à jour d'une réponse automatique`],
    [EventCode.DELETE_RESPONDER, `suppression d'une réponse automatique`],
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
