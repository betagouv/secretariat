import { Mission } from './mission'

export interface Member {
    id: String,
    fullname: String,
    github: String,
    missions: Mission[],
    start: String,
    end: String,
    employer: String,
}
