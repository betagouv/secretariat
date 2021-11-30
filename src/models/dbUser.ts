
export interface DBUser {
    secondary_email: string;
    primary_email?: string;
    username: string;
    created_at: Date;
}

export interface DBUserWithMattermostUsername {
    secondary_email: string;
    primary_email: string;
    username: string;
    created_at: Date;
    mattermostUsername: string;
}
