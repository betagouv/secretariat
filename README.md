# secretariat
Le secrétariat de l’incubateur

## Dev de l'app de secrétariat

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
- Lancer l'app : `npm run dev`
- Ouvrir `http://localhost:8100` (8100 est le port par défaut, vous pouvez le changer avec la variable d'env PORT)

### Debug avec un autre domaine OVH
- Configurer la variable d'environnement SECRETARIAT_DOMAIN (par défaut à beta.gouv.fr)

### Debug avec une autre API utilisateur
- Configurer la variable d'environnement USERS_API (par défaut à https://beta.gouv.fr/api/v1.6/authors.json)

## Script pour faire des taches en local

# Générer le graphe des redirections emails

- Configurer les variables d'environnements : OVH_APP_KEY, OVH_APP_SECRET et OVH_CONSUMER_KEY (Avec une clé aillant un accès aux emails)
- Lancer le script : `node ./scripts/export_redirections_to_dot.js > redirections.dot`
- Lancer graphviz : `dot -Tpdf redirections.dot -o redirections.pdf` (Format disponible : svg,png, ...)

# Supprimer une redirection
- Configurer les variables d'environnements : OVH_APP_KEY, OVH_APP_SECRET et OVH_CONSUMER_KEY (Avec une clé aillant un accès aux emails)
- Lancer le script : `node ./scripts/delete_redirections.js from@beta.gouv.fr to@example.com`

## Générer clé API OVH

Lien : https://eu.api.ovh.com/createToken/

- Nécessaires pour les fonctionalités en cours
```
GET /email/domain/beta.gouv.fr/*
POST /email/domain/beta.gouv.fr/account
DELETE /email/domain/beta.gouv.fr/account/*
POST  /email/domain/beta.gouv.fr/redirection
DELETE  /email/domain/beta.gouv.fr/redirection/*
POST /email/domain/beta.gouv.fr/account/*/changePassword
```

- Nécessaires pour les prochaines fonctionalités
```
POST /email/domain/beta.gouv.fr/mailingList
POST /email/domain/beta.gouv.fr/mailingList/*/subscriber
DELETE /email/domain/beta.gouv.fr/mailingList/*/subscriber/*
```

## Dev docker-compose

- Récupéré les dépendences : `docker-compose run web npm install`
- Lancer le service : `docker-compose up`
- Lancer les tests : `docker-compose run web npm test`
- Exemple pour développer dans un contenaire :
	- `docker run --rm --env-file ../.env.secretariat.dev -v `pwd`:/app -w /app -ti -p 8100 node /bin/bash` (avec vos variables d'environnement dans ../.env.secretariat.dev )


## Production

`npm run start`
