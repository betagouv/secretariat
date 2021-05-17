import { Mission } from './mission'

export interface Member {
    id: String,
    fullname: String,
    missions: Mission[],
    pipo: String
}
