export enum SponsorType {
    SPONSOR_TYPE_ADMINISTRATION_CENTRALE="administration-centrale",
    SPONSOR_TYPE_SERVICE_DECONCENTRE="service-deconcentre",
    SPONSOR_TYPE_OPERATEUR="operateur",
    SPONSOR_TYPE_SECURITE_SOCIALE="securite-sociale",
    SPONSOR_TYPE_COLLECTIVITE_TERRITORIALE="collectivite-territoriale",
    SPONSOR_TYPE_AUTRE="autre",
}

export enum SponsorDomaineMinisteriel {
    SPONSOR_DOMAINE_AFFAIRES_ETRANGERES='affaires-etrangeres',
    SPONSOR_DOMAINE_AGRICULTURE='agriculture',
    SPONSOR_DOMAINE_ARMEES='armees',
    SPONSOR_DOMAINE_BERCY='bercy',
    SPONSOR_DOMAINE_CULTURE='culture',
    SPONSOR_DOMAINE_EDUCATION='education',
    SPONSOR_DOMAINE_ENSEIGNEMENT_SUP='enseignement-sup',
    SPONSOR_DOMAINE_ENVIRONNEMENT='environnement',
    SPONSOR_DOMAINE_INTERIEUR='interieur',
    SPONSOR_DOMAINE_JUSTICE='justice',
    SPONSOR_DOMAINE_OUTRE_MER='outre-mer',
    SPONSOR_DOMAINE_SOLIDARITE_SANTE='solidarite-sante',
    SPONSOR_DOMAINE_SPM='spm # Service du premier ministre',
    SPONSOR_DOMAINE_SPORT='sport',
    SPONSOR_DOMAINE_TRAVAIL='travail',
    SPONSOR_DOMAINE_TERRITOIRES='territoires',
    SPONSOR_DOMAINE_AUTRES='autres'
}

export interface Sponsor {
    name: string,
    acronym: string,
    domaine_ministeriel: SponsorDomaineMinisteriel
    type: SponsorType
}
