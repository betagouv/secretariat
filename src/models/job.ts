import { Domaine } from "./member";

export interface Job {
    id: string,
    url: string,
    title: string,
    published: string,
    domaines: Domaine[],
    updated: string,
    author: string,
    technos: string,
    content: string
}

export interface JobWTTJ {
    id: number
    reference: string,
    name: string,
    slug: string,
    description: string,
    published_at: string,
    profile: string,
}
