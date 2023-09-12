import { GithubMission } from "@/models/mission";
import { Phase } from "@/models/startup";
export interface GithubAuthorChange {
    role?: string,
    missions?: GithubMission[],
    startups?: string[],
    previously?: string[],
}

export interface GithubStartupChange {
    phases?: Phase[],
    link: string,
    dashlord_url: string,
    mission: string,
    stats_url: string,
    repository: string,
    sponsors: [string],
    incubator: string
}