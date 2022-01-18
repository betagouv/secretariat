export enum EventCode {
    EMAIL_ACTIVE="EMAIL_ACTIVE",
    EMAIL_SUSPENDED="EMAIL_SUSPENDED",
    EMAIL_DELETED="EMAIL_DELETED",
    EMAIL_EXPIRED="EMAIL_EXPIRED",
    EMAIL_CREATION_PENDING="EMAIL_CREATION_PENDING",
    EMAIL_RECREATION_PENDING="EMAIL_RECREATION_PENDING"
}

export interface DBUser {
    secondary_email: string;
    primary_email?: string;
    username: string;
    created_at: Date;
    primary_email_status: EventCode;
    primary_email_status_updated_at: Date;
}
