enum Status { "independant", "admin", "service" };
enum Domaine {
    "Animation",
    "Coaching",
    "Déploiement",
    "Design",
    "Développement",
    "Intraprenariat",
    "Produit",
    "Autre"
};

export interface Mission {
    start: String,
    end: String,
    status: Status,
    domaine: Domaine,
    employer: String 
}
