import knex from "@/db";
import hstore from "@/lib/hstore";


export enum EventCode {
    MEMBER_REDIRECTION_CREATED = "MEMBER_REDIRECTION_CREATED",
    MEMBER_REDIRECTION_DELETED = "MEMBER_REDIRECTION_DELETED",
    MEMBER_EMAIL_CREATED = "MEMBER_EMAIL_CREATED",
    MEMBER_EMAIL_DELETED = "MEMBER_EMAIL_DELETED",
    MEMBER_PASSWORD_UPDATED = "MEMBER_PASSWORD_UPDATED",
    MEMBER_RESPONDER_CREATED = "MEMBER_RESPONDER_CREATED",
    MEMBER_RESPONDER_UPDATED = "MEMBER_RESPONDER_UPDATED",
    MEMBER_RESPONDER_DELETED = "MEMBER_RESPONDER_DELETED",
    MARRAINAGE_CREATED = "MARRAINAGE_CREATED",
    MARRAINAGE_ACCEPTED = "MARRAINAGE_ACCEPTED",
    MEMBER_MARRAINAGE_DECLINED = "MEMBER_MARRAINAGE_DECLINED",
    MEMBER_SECONDARY_EMAIL_UPDATED = "MEMBER_SECONDARY_EMAIL_UPDATED",
    MEMBER_PRIMARY_EMAIL_UPDATED = "MEMBER_PRIMARY_EMAIL_UPDATED",
    MEMBER_END_DATE_UPDATED = "MEMBER_END_DATE_UPDATED",
    MEMBER_COMMUNICATION_EMAIL_UPDATE = "MEMBER_COMMUNICATION_EMAIL_UPDATE",
    MEMBER_EMAIL_RECREATED = "MEMBER_EMAIL_RECREATED"
}

interface ActionMetadata {
    old_value?: string,
    value?: string
}

interface Event {
    action_code: EventCode,
    action_metadata: ActionMetadata,
    action_on_username: string,
    created_by_username: string
}

export type EventParam = {
    action_on_username?: string,
    created_by_username: string,
    action_metadata?: ActionMetadata,
}

export async function addEvent (eventCode: EventCode, param: EventParam) : Promise<void> {
    const event: Event = {
        action_code: eventCode,
        action_metadata: param.action_metadata,
        action_on_username: param.action_on_username,
        created_by_username: param.created_by_username
    }
    return knex('events').insert({
        ...event,
        action_metadata: param.action_metadata ? hstore.stringify(param.action_metadata) : undefined,
    })
}


