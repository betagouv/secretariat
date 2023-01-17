interface Relationship {
    incubator: {
        data: {
            type: string,
            id: string
        }
    }
}

export const PHASE_READABLE_NAME = {
    'acceleration': 'En Accélération',
    'investigation': 'En Investigation',
    'transfert': 'Transférée',
    'construction': 'En Construction',
    'alumni': 'Partenariat terminé',
    'success': 'Pérennisé'
}

export enum StartupPhase {
    PHASE_INVESTIGATION="investigation",
    PHASE_CONSTRUCTION="construction",
    PHASE_ACCELERATION="acceleration",
    PHASE_TRANSFER="transfer",
    PHASE_SUCCESS="success",
    PHASE_ALUMNI="alumni",
}

export interface Startup {
    id: string;
    name: string;
    repository: string;
    contact: string;
    expired_members: string[];
    active_members: string[];
    previous_members: string[];
    phases: Phase[]
}

export interface StartupInfo {
    id: string;
    attributes: {
        name: string;
        repository: string;
        contact: string;
        expired_members: string[];
        active_members: string[];
        previous_members: string[];
        pitch: string;
        stats_url: string;
        link: string;
        incubator: string;
        phases: Phase[];
    };
    relationships: Relationship;
}

export interface Phase {
    name: StartupPhase;
    start: Date;
    end?: Date;
}

export interface DBStartup {
    mailing_list?: string;
    id: string;
    name: string;
    pitch: string;
    stats_url: string;
    link: string;
    repository: string;
    contact: string;
    phases: Phase[];
    current_phase: string;
    incubator: string;
}
