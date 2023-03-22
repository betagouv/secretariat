export interface BadgeDossier {
    id: string,
    number: number,
    archived: boolean,
    state: string,
    dateDerniereModification: string,
    dateDepot: string,
    datePassageEnConstruction: string | null,
    datePassageEnInstruction: string | null,
    dateTraitement: string | null,
    dateExpiration: string | null,
    dateSuppressionParUsager: null,
    motivation: string,
    traitements: {
        state: 'en_construction' | 'en_instruction' | 'accepte',
        emailAgentTraitant: string | null,
        dateTraitement: string,
        motivation: string | null

    }[],
    champs: {
        id: string,
        label: string,
        stringValue: string
    }[],
    annotations: [
        {
            label: 'reçu chez anne',
            stringValue: 'false',
            checked: boolean
        },
        {
            label: 'valider dans origami',
            stringValue: 'false',
            checked: boolean
        },
        {
            label: 'à valider par florian',
            stringValue: 'false',
            checked: boolean
        },
        {
            label: 'badge à récupérer',
            stringValue: 'false',
            checked: boolean
        },
        {
            "label":"Status",
            "stringValue": string
        }
    ]
}
