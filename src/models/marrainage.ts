export interface Marrainage {
    username: string,
    last_onboarder: string,
    count: number,
    completed: boolean,
    created_at: string,
    last_updated: string
}

export enum MarrainageGroupStatus {
    DOING="DOING",
    PENDING="PENDING",
    DONE="DONE",
}

export interface MarrainageGroup {
    id: number,
    onboarder: string,
    created_at: Date,
    status: MarrainageGroupStatus
    count: number
}

export interface MarrainageGroupMember {
    marrainage_group_id: number,
    username: string
}
