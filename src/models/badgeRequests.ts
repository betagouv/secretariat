export enum BADGE_REQUEST {
    BADGE_REQUEST_PENDING = 'BADGE_REQUEST_PENDING',
    BADGE_REQUEST_SENT = "BADGE_REQUEST_SENT"
}

export interface BadgeRequest {
    id: number,
    status: BADGE_REQUEST,
    start_date: Date,
    end_date: Date,
    created_at: Date,
    updated_at: Date,
    request_id: string,
    username: string
}
