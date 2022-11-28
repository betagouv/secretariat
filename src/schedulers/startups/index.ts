
export interface StartupDetail {
    active_members: string[],
    id: string,
    phases: {
        name: StartupPhase,
        start: string
    }[]
}

export enum StartupPhase {
    PHASE_INVESTIGATION="investigation",
    PHASE_CONSTRUCTION="construction",
    PHASE_ACCELERATION="acceleration",
    PHASE_TRANSFER="transfer",
    PHASE_SUCCESS="success"
}


export const generateMailingListName = (startup: StartupDetail) : string => {
    const MAX_MAILING_LIST_NAME = 32
    const name = startup.id.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    return `set-${name}`.slice(0, MAX_MAILING_LIST_NAME);
}
