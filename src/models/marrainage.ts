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