# Espace Membre

L'espace membre de l’incubateur

## Dev de l'app Espace Membre

### Variables d'environnement

copier [`.env.development`](./.env.development) en `.env`

### Lancer en mode développement

Lancer PostgreSQL avec `docker compose up -d` puis démarrer l'application avec ces commandes :

```sh
npm install # Récupère les dépendances
npm run migrate # Applique les migrations
npm run dev-import-from-www # Ajoute les données du site beta.gouv.fr (utilisateur, produits, incubateurs, ...)
npm run dev
```

L'application sera disponible sur http://localhost:8100 et vous pouvez vous logger avec `valid.member@betagouv.ovh` en récupérant l'email de connexion via le maildev disponible sur http://localhost:1080.

Pour récupérer les données publiques depuis beta.gouv.fr lancer `yarn dev-import-from-www`.

### Lancer les tests

```
» npm run test
```

### Debug avec le serveur SMTP Maildev

[Maildev](http://maildev.github.io/maildev/) est un serveur SMTP avec une interface web conçu pour le développement et les tests.

Le docker-compose intègre une instance de maildev pour le développement.

Tous les emails envoyés par le code de l'espace membre seront visibles depuis l'interface web de Maildev (`http://localhost:1080/`).

### Générer clé API OVH

_Si vous n'avez pas les droits pour générer les credentials OVH, postez un message sur [#incubateur-amélioration-secretariat](https://startups-detat.slack.com/archives/C017J6CUN2V)._

Lien : https://eu.api.ovh.com/createToken/

-   Nécessaires pour les fonctionalités en cours

```
GET /email/domain/beta.gouv.fr/*
POST /email/domain/beta.gouv.fr/account
DELETE /email/domain/beta.gouv.fr/account/*
POST /email/domain/beta.gouv.fr/redirection
DELETE /email/domain/beta.gouv.fr/redirection/*
POST /email/domain/beta.gouv.fr/account/*/changePassword
```

-   Nécessaires pour les prochaines fonctionalités

```
POST /email/domain/beta.gouv.fr/mailingList
POST /email/domain/beta.gouv.fr/mailingList/*/subscriber
DELETE /email/domain/beta.gouv.fr/mailingList/*/subscriber/*
GET /email/domain/beta.gouv.fr/mailingList/*/subscriber
GET /email/domain/beta.gouv.fr/responder/*
POST /email/domain/beta.gouv.fr/responder
PUT /email/domain/beta.gouv.fr/responder/*
DELETE /email/domain/beta.gouv.fr/responder/*
```

### Debug sans notifications Mattermost

Pour certaines actions, l'espace membre envoie une notification Mattermost. En local, vous pouvez mettre les variables d'environnements `CHAT_WEBHOOK_URL_SECRETARIAT` et `CHAT_WEBHOOK_URL_GENERAL` à un service qui reçoit des requêtes POST et répond avec un `200 OK` systématiquement.

[Beeceptor](https://beeceptor.com/) permet de le faire avec une interface en ligne sans besoin de télécharger quoi que ce soit.

Sinon, certains outils gratuits comme [Mockoon](https://mockoon.com/) ou [Postman](https://www.postman.com/) permettent de créer des serveurs mock facilement aussi ([Guide Postman](https://learning.postman.com/docs/designing-and-developing-your-api/mocking-data/setting-up-mock/#creating-mock-servers-in-app)).

### Debug avec un autre domaine OVH

Lorsqu'on utilise un autre domaine OVH (par exemple, un domain bac-à-sable pour le développement), la variable `SECRETARIAT_DOMAIN` doit être renseignée. Par défaut, le domaine est `beta.gouv.fr`.

## Scripts pour faire des taches en local

### Générer le graphe des redirections emails

-   Configurer les variables d'environnements : `OVH_APP_KEY`, `OVH_APP_SECRET` et `OVH_CONSUMER_KEY` (Avec une clé ayant un accès aux emails)
-   Lancer le script : `node ./scripts/export_redirections_to_dot.ts > redirections.dot`
-   Lancer graphviz : `dot -Tpdf redirections.dot -o redirections.pdf` (Format disponible : svg,png, ...)

### Supprimer une redirection

-   Configurer les variables d'environnements : `OVH_APP_KEY`, `OVH_APP_SECRET` et `OVH_CONSUMER_KEY` (Avec une clé ayant un accès aux emails)
-   Lancer le script : `node ./scripts/delete_redirections.js from@beta.gouv.fr to@example.com`

## Scripts CRON

Les tâches CRON sont gérées par une app scalingo dédiée via le [Procfile](./Procfile)

La listes des cron sont dans les fichiers :
./src/server/scheduler/cron.ts
./src/server/queueing/schedule.ts

## Cron Jobs

See detailed info in [CRON.md](./CRON.md)
