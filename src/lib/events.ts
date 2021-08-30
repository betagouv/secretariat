import knex from "../db";

export enum EventCode {
    CREATE_REDIRECTION,
    DELETE_REDIRECTION,
}

const EventDescriptions = new Map<EventCode, string>([
    [EventCode.CREATE_REDIRECTION, `création d'une redirection`],
    [EventCode.DELETE_REDIRECTION, 'suppression de redirection']
]);

interface Event {
    action_code: EventCode,
    action_description: string,
    action_on_username: string,
    created_by_username: string
}

interface EventParam {
    action_on_username?: string,
    created_by_username: string
}

export async function addEvent(eventCode: EventCode, param: EventParam) {
    const event: Event = {
        action_code: eventCode,
        action_description: EventDescriptions.get(eventCode),
        action_on_username: param.action_on_username,
        created_by_username: param.created_by_username
    }
    return knex('events').insert(event).returning('*').then(db => db[0])
}
