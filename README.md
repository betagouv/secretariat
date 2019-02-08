# secretariat
Le secrétariat de l’incubateur

## Script

# Générer le graphe des redirections emails

- Configurer les variables d'environnements : OVH_APP_KEY, OVH_APP_SECRET et OVH_CONSUMER_KEY (Avec une clé aillant un accès aux emails)
- Lancer le script : `node ./scripts/export_redirections_to_dot.js > redirections.dot`
- Lancer graphviz : `dot -Tpdf redirections.dot -o redirections.pdf` (Format disponible : svg,png, ...)
