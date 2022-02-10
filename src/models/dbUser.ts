export enum EmailStatusCode {
    EMAIL_ACTIVE="EMAIL_ACTIVE",
    EMAIL_SUSPENDED="EMAIL_SUSPENDED",
    EMAIL_DELETED="EMAIL_DELETED",
    EMAIL_EXPIRED="EMAIL_EXPIRED",
    EMAIL_CREATION_PENDING="EMAIL_CREATION_PENDING",
    EMAIL_RECREATION_PENDING="EMAIL_RECREATION_PENDING",
    EMAIL_UNSET="EMAIL_UNSET"
}

export interface DBUser {
    secondary_email: string;
    primary_email?: string;
    username: string;
    created_at: Date;
    primary_email_status: EmailStatusCode;
    primary_email_status_updated_at: Date;
}

export interface PartialUser {
    secondary_email?: string;
    primary_email?: string;
    username?: string;
    created_at?: Date;
    primary_email_status?: EmailStatusCode;
    primary_email_status_updated_at?: Date;
}
