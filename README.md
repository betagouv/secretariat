# secretariat
Le secrétariat de l’incubateur

## Dev

- Variables d'environnement nécessaires :
   - OVH_APP_KEY
   - OVH_APP_SECRET
   - OVH_CONSUMER_KEY
   - SESSION_SECRET (clé de 32 caractère aléatoires, important en prod)
   - MAIL_SERVICE (service géré par nodemailer, `mailjet` est dispo)
   - MAIL_USER
   - MAIL_PASS
   - SECURE (true si https sinon false)
   - SLACK_WEBHOOK_URL (adresse d'envoit des notifs : https://hooks.slack.com/services/...)
- Récupérer les dépendances avec npm
- Lancer l'app : `node index.js`
- Ouvrir `http://localhost:8100` (8100 est le port par défaut, vous pouvez le changer avec la variable d'env PORT)

## Script

# Générer le graphe des redirections emails

- Configurer les variables d'environnements : OVH_APP_KEY, OVH_APP_SECRET et OVH_CONSUMER_KEY (Avec une clé aillant un accès aux emails)
- Lancer le script : `node ./scripts/export_redirections_to_dot.js > redirections.dot`
- Lancer graphviz : `dot -Tpdf redirections.dot -o redirections.pdf` (Format disponible : svg,png, ...)
