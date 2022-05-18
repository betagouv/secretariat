import { Startup } from "./startup"

export interface Incubator {
    title: string,
    owner: string,
    contact: string,
    address: string,
    website: string,
    github: string,
    startups: Startup[]
}
