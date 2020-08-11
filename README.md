# secretariat

Le secrétariat de l’incubateur

## Dev de l'app de secrétariat

### Variables d'environnement

- Variables d'environnement nécessaires :
   - `OVH_APP_KEY` - [Obtenir les credentials OVH pour débugger](#Générer-clé-API-OVH)
   - `OVH_APP_SECRET`
   - `OVH_CONSUMER_KEY`
   - `SESSION_SECRET` - Clé de 32 caractère aléatoires, important en prod
   - `MAIL_SERVICE` - Service [géré par nodemailer](https://nodemailer.com/smtp/well-known/) ([Débugger SMTP en local](#Debug-avec-le-serveur-SMTP-Maildev))
   - `MAIL_USER`
   - `MAIL_PASS`
   - `SECURE` - _true_ si https sinon _false_
   - `SLACK_WEBHOOK_URL` - Adresse d'envoi des notifications Slack - par ex. : _https://hooks.slack.com/services/..._ ([Débugger sans Slack](#Debug-sans-notifications-Slack))
   - `PGUSER`
   - `PGPASSWORD`
   - `PGHOST`
   - `PGPORT`
   - `PGDATABASE`

- Variables d'environnement optionnelles :
   - `SECRETARIAT_DOMAIN` - Domaine OVH à utiliser ([Débugger avec un autre domaine OVH](#Debug-avec-un-autre-domaine-OVH))
   - `USERS_API` - API User à utiliser ([Débugger avec une autre API](#Debug-avec-une-autre-API-utilisateur))
   - `POSTGRES_PASSWORD` - Cette variable sert à lancer l'image docker de postgres et donc seulement nécessaire si Docker est utilisé pour le développement.

### Lancer en mode développement

Une fois Postgres lancé, vous pouvez démarrer l'application avec ces commandes :

```
» npm install # Récupère les dépendances
» npm run migrate # Applique les migrations
» npm run dev
   ...
   Running on port: 8100
```
L'application sera disponible sur `http://localhost:8100` (8100 est le port par défaut, vous pouvez le changer avec la variable d'env `PORT`)

### Lancer en mode production

```
» npm run start
   ...
   Running on port: 8100
```

### Lancer les tests

```
» npm run test
```

### Générer clé API OVH

_Si vous n'avez pas les droits pour générer les credentials OVH, postez un message sur [#incubateur-amélioration-secretariat](https://startups-detat.slack.com/archives/C017J6CUN2V)._

Lien : https://eu.api.ovh.com/createToken/

- Nécessaires pour les fonctionalités en cours
```
GET /email/domain/beta.gouv.fr/*
POST /email/domain/beta.gouv.fr/account
DELETE /email/domain/beta.gouv.fr/account/*
POST /email/domain/beta.gouv.fr/redirection
DELETE /email/domain/beta.gouv.fr/redirection/*
POST /email/domain/beta.gouv.fr/account/*/changePassword
```

- Nécessaires pour les prochaines fonctionalités
```
POST /email/domain/beta.gouv.fr/mailingList
POST /email/domain/beta.gouv.fr/mailingList/*/subscriber
DELETE /email/domain/beta.gouv.fr/mailingList/*/subscriber/*
```

### Debug avec le serveur SMTP Maildev

[Maildev](http://maildev.github.io/maildev/) est un serveur SMTP avec une interface web conçus pour le développement et les tests.

Une fois [installé](http://maildev.github.io/maildev/#install) et lancé, il suffit de mettre la variable d'environnement `MAIL_SERVICE` à `maildev` pour l'utiliser. `MAIL_USER` et `MAIL_PASS` ne sont pas nécessaires.

Tous les emails envoyés par le code du secrétariat seront visibles depuis l'interface web de Maildev (`http://localhost:1080/`).

### Debug sans notifications Slack

Pour certaines actions, le secrétariat envoie une notification Slack. En local, vous pouvez mettre la variable d'environnement `SLACK_WEBHOOK_URL` à un service qui reçoit des requêtes POST et répond avec un `200 OK` systématiquement.

[Beeceptor](https://beeceptor.com/) permet de le faire avec une interface en ligne sans besoin de télécharger quoi que ce soit.

Sinon, certains outils gratuits comme [Mockoon](https://mockoon.com/) ou [Postman](https://www.postman.com/) permettent de créer des serveurs mock facilement aussi ([Guide Postman](https://learning.postman.com/docs/designing-and-developing-your-api/mocking-data/setting-up-mock/#creating-mock-servers-in-app)).

### Debug avec un autre domaine OVH

Lorsqu'on utilise un autre domaine OVH (par exemple, un domain bac-à-sable pour le développement), la variable `SECRETARIAT_DOMAIN` doit être renseignée. Par défaut, le domaine est `beta.gouv.fr`.

### Debug avec une autre API utilisateur

Configurer la variable d'environnement `USERS_API` (par défaut à `https://beta.gouv.fr/api/v1.6/authors.json`)

### Créer des migrations
[KnexJS](http://knexjs.org/#Migrations) permet de créer des migrations de base de données. Un shortcut a été ajouté au `package.json` pour créer une migration :

```
npm run makeMigration <nom de la migration>
```

Pour utiliser d'autres options, vous pouvez utiliser le CLI de KnexJS avec `./node_modules/knex/bin/cli.js`.

Une fois la migration créée, vous pouvez l'appliquer avec `npm run migrate`.

## Scripts pour faire des taches en local

### Générer le graphe des redirections emails

- Configurer les variables d'environnements : `OVH_APP_KEY`, `OVH_APP_SECRET` et `OVH_CONSUMER_KEY` (Avec une clé ayant un accès aux emails)
- Lancer le script : `node ./scripts/export_redirections_to_dot.js > redirections.dot`
- Lancer graphviz : `dot -Tpdf redirections.dot -o redirections.pdf` (Format disponible : svg,png, ...)

### Supprimer une redirection

- Configurer les variables d'environnements : `OVH_APP_KEY`, `OVH_APP_SECRET` et `OVH_CONSUMER_KEY` (Avec une clé ayant un accès aux emails)
- Lancer le script : `node ./scripts/delete_redirections.js from@beta.gouv.fr to@example.com`

### Dev docker-compose

- Récupérer les dépendences : `docker-compose run web npm install`
- Lancer le service : `docker-compose up`
- Créer les tables : `docker-compose run web npm run migrate`
- Lancer les tests : `docker-compose run web npm test`

### Dev docker sans docker-compose

- Exemple pour développer dans un container :
	- `docker run --rm --env-file ../.env.secretariat.dev -v $(pwd):/app -w /app -ti -p 8100 node /bin/bash` (avec vos variables d'environnement dans ../.env.secretariat.dev)
