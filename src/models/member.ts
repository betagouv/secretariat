import { Mission } from './mission'

export interface Member {
    id: String,
    fullname: String,
    missions: Mission[],
    start: String,
    end: String,
    employer: String,
}
