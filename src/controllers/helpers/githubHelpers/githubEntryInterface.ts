import { GithubMission } from "@/models/mission";
import { SponsorDomaineMinisteriel, SponsorType } from "@/models/sponsor";
import { Phase } from "@/models/startup";
export interface GithubAuthorChange {
    role?: string,
    missions?: GithubMission[],
    startups?: string[],
    previously?: string[],
}

export interface GithubFile {
    path: string,
    name: string
}

export interface GithubAuthorFile extends GithubFile {
    changes: GithubAuthorChange,
    content: string
}

export interface GithubStartupFile extends GithubFile {
    changes: GithubStartupChange,
    content: string
}

export interface GithubSponsorFile extends GithubFile {
    changes: GithubSponsorChange
}

export interface GithubSponsorChange {
    name: string,
    acronym: string,
    domaine_ministeriel: SponsorDomaineMinisteriel
    type: SponsorType
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

export interface GithubBetagouvFile {
    changes: GithubAuthorChange | GithubStartupChange | GithubSponsorChange,
    path: string,
    content?: string
}