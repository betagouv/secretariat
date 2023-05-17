export interface Option {
    key: string,
    name: string
}

export const EMAIL_STATUS_READABLE_FORMAT = {
    EMAIL_ACTIVE: 'Actif',
    EMAIL_REDIRECTION_ACTIVE: `L'email est une redirection. Email attributaire`,
    EMAIL_SUSPENDED: 'Suspendu',
    EMAIL_DELETED: 'Supprimé',
    EMAIL_EXPIRED: 'Expiré',
    EMAIL_CREATION_PENDING: 'Création en cours',
    EMAIL_RECREATION_PENDING: 'Recréation en cours',
    EMAIL_UNSET: 'Non défini'
}
  