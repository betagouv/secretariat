import { GithubMission } from "@/models/mission";
import { SponsorDomaineMinisteriel, SponsorType } from "@/models/sponsor";
import { AccessibilityStatus, Phase } from "@/models/startup";
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

export interface GithubImageFile extends GithubFile {
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
    title?: string,
    dashlord_url: string,
    mission: string,
    stats_url: string,
    repository: string,
    contact: string,
    sponsors: [string],
    incubator: string,
    accessibility_status: AccessibilityStatus,
    analyse_risques_url: string,
    analyse_risques: boolean,
}

export type GithubBetagouvFile = GithubAuthorFile | GithubSponsorFile | GithubImageFile | GithubStartupFile