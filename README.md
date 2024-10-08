# Espace Membre

L'espace membre de l’incubateur

## Dev de l'app Espace Membre

### Variables d'environnement

-   Variables d'environnement nécessaires :
    -   `OVH_APP_KEY` - [Obtenir les credentials OVH pour débugger](#Générer-clé-API-OVH)
    -   `OVH_APP_SECRET`
    -   `OVH_CONSUMER_KEY`
    -   `SESSION_SECRET` - Clé de 32 caractère aléatoires, important en prod
    -   `MAIL_SERVICE` - Service [géré par nodemailer](https://nodemailer.com/smtp/well-known/) ([Débugger SMTP en local](#Debug-avec-le-serveur-SMTP-Maildev)). Si absente, `MAIL_HOST`, `MAIL_PORT`, et `MAIL_IGNORE_TLS` seront utilisées.
    -   `MAIL_USER`
    -   `MAIL_PASS`
    -   `SECURE` - _true_ si https sinon _false_
    -   `HOSTNAME` - Par exemple _localhost_ pour le développement en local
    -   `CHAT_WEBHOOK_URL_SECRETARIAT` - Adresse d'envoi des notifications Mattermost (anciennement Slack) pour le canal "#secretariat" - par ex. : _https://hooks.mattermost.com/services/..._ ([Débugger sans Mattermost](#Debug-sans-notifications-Slack))
    -   `CHAT_WEBHOOK_URL_GENERAL` - Adresse d'envoi des notifications Mattermost (anciennement Slack) pour le canal "#general" - par ex. : _https://hooks.mattermost.com/services/..._ ([Débugger sans Mattermost](#Debug-sans-notifications-Slack))
    -   `DATABASE_URL` - Le [string de connexion](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING) pour se connecter à Postgres (pensez à échapper les caractères spéciaux s'il s'agit d'une URI). Le string de connexion doit contenir le _user_, _password_, _host_, _port_ et le nom de la base de données.
    -   `GITHUB_TOKEN` - Le [Personal Access Token](https://github.com/settings/tokens) du compte Github utilisé pour créer les PR des nouvelles recrues
    -   `GITHUB_REPOSITORY` - Le repository Github qui contient les fiches des utilisateurs (par ex: `betagouv/beta.gouv.fr`)
    -   `GITHUB_FORK` - Le fork du GITHUB_REPOSITORY utilisé pour créer les PRs, (par ex: `test-user/beta.gouv.fr`).
    -   `GITHUB_ORG_ADMIN_TOKEN` - Le [Personal Access Token](https://github.com/settings/tokens) du compte Github utilisé pour gérer les membres de la communauté
-   Variables d'environnement optionnelles :
    -   `SECRETARIAT_DOMAIN` - Domaine OVH à utiliser ([Débugger avec un autre domaine OVH](#Debug-avec-un-autre-domaine-OVH))
    -   `USERS_API` - API User à utiliser ([Débugger avec une autre API](#Debug-avec-une-autre-API-utilisateur))
    -   `POSTGRES_PASSWORD` - Cette variable sert à lancer l'image docker de postgres et donc seulement nécessaire si Docker est utilisé pour le développement.
    -   `MAIL_HOST` - Si la variable `MAIL_SERVICE` est absente, cette variable sera utilisée pour spécifier le hostname ou adresse IP à utiliser pour l'envoi d'emails avec [Nodemailer](https://nodemailer.com/smtp/).
    -   `MAIL_PORT` - Si la variable `MAIL_SERVICE` est absente, cette variable sera utilisée pour spécifier le port à utiliser pour l'envoi d'emails avec [Nodemailer](https://nodemailer.com/smtp/).
    -   `MAIL_IGNORE_TLS` - Si la variable `MAIL_SERVICE` est absente, cette variable sera utilisée pour l'utilisation de TLS dans la connexion email avec [Nodemailer](https://nodemailer.com/smtp/).
    -   `NEWSLETTER_HASH_SECRET` - Clé pour générer un id pour les newsletters, important en prod
    -   `INVESTIGATION_REPORTS_IFRAME_URL` - URL de l'iframe Airtable contenant les bilans d'investigations et qui est intégrée à la page ressources
    -   `GITHUB_ORGANIZATION_NAME` - Nom de l'organization github à laquelle inviter les membres
    -   `MATTERMOST_INVITE_ID` - ID secret de l'invitation qui permet de se créer un compte sur l'espace mattermost https://mattermost.incubateur.net/signup_user_complete/?id=[ID]
    -   `MATTERMOST_TEAM_ID` - ID de la team `Communauté`
    -   `MATTERMOST_BOT_TOKEN` - Token du bot mattermost qui permet de faire les requêtes à l'api
    -   `NEXT_PUBLIC_MATOMO_URL` - URL de l'instance Matomo _(format `https://xxx.yyy.zzz/`)_
    -   `NEXT_PUBLIC_MATOMO_SITE_ID`: - ID du site sur l'instance Matomo

### Lancer en mode développement

Une fois Postgres lancé, vous pouvez démarrer l'application avec ces commandes :

-   Créer le fichier de configuration : `cp .env.example .env` et le remplir avec les identifiants OVH obtenus plus haut.

```
» npm install # Récupère les dépendances
» npm run migrate # Applique les migrations
» npm run seed # Ajoute des utilisateurs dans la base users. Utilisez l'un des primary_email présent dans la bdd pour vous connecter
» npm run dev
   ...
   Running on port: 8100
```

L'application sera disponible sur `http://localhost:8100` (8100 est le port par défaut, vous pouvez le changer avec la variable d'env `PORT`)

### Lancer avec docker-compose

-   Créer le fichier de configuration : `cp .env.example .env` et le remplir avec les identifiants OVH obtenus plus haut.
-   Lancer le service et initialiser la base de données : `docker-compose up -d` - disponible sur http://localhost:8100
-   npm run dev
-   Pour ajouter des données à la base de données (facultatif): `docker-compose run web npm run seed;`
-   Lancer les tests : `docker-compose run web npm test`

### Lancer avec docker sans docker-compose

-   Exemple pour développer dans un container :
    -   `docker run --rm --env-file ../.env.secretariat.dev -v $(pwd):/app -w /app -ti -p 8100 node /bin/bash` (avec vos variables d'environnement dans ../.env.secretariat.dev)

### Lancer en mode production

```
» npm run build
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

### Debug avec le serveur SMTP Maildev

[Maildev](http://maildev.github.io/maildev/) est un serveur SMTP avec une interface web conçus pour le développement et les tests.

Sans docker:
Une fois [installé](http://maildev.github.io/maildev/#install) et lancé, il suffit de mettre la variable d'environnement `MAIL_SERVICE` à `maildev` pour l'utiliser. `MAIL_USER` et `MAIL_PASS` ne sont pas nécessaires.

Avec docker:
ne pas préciser de MAIL_SERVICE, les bonnes variables d'environnement sont déjà précisées dans le docker-compose

Tous les emails envoyés par le code de l'espace membre seront visibles depuis l'interface web de Maildev (`http://localhost:1080/`).

### Debug sans notifications Mattermost

Pour certaines actions, l'espace membre envoie une notification Mattermost. En local, vous pouvez mettre les variables d'environnements `CHAT_WEBHOOK_URL_SECRETARIAT` et `CHAT_WEBHOOK_URL_GENERAL` à un service qui reçoit des requêtes POST et répond avec un `200 OK` systématiquement.

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

Une fois la migration créée, vous pouvez l'appliquer avec :

```
npm run migrate
```

Pour utiliser d'autres commandes, le [CLI de KnexJS](http://knexjs.org/#Migrations) est disponible avec `./node_modules/knex/bin/cli.js`. Par exemple, pour faire un rollback :

```
./node_modules/knex/bin/cli.js migrate:rollback
```

## Scripts pour faire des taches en local

### Générer le graphe des redirections emails

-   Configurer les variables d'environnements : `OVH_APP_KEY`, `OVH_APP_SECRET` et `OVH_CONSUMER_KEY` (Avec une clé ayant un accès aux emails)
-   Lancer le script : `node ./scripts/export_redirections_to_dot.ts > redirections.dot`
-   Lancer graphviz : `dot -Tpdf redirections.dot -o redirections.pdf` (Format disponible : svg,png, ...)

### Supprimer une redirection

-   Configurer les variables d'environnements : `OVH_APP_KEY`, `OVH_APP_SECRET` et `OVH_CONSUMER_KEY` (Avec une clé ayant un accès aux emails)
-   Lancer le script : `node ./scripts/delete_redirections.js from@beta.gouv.fr to@example.com`

## Explication du fonctionnement des pull requests Github

En prod, l'app sécrétariat génère des pulls requests sur le github reposity `betagouv/beta.gouv.fr`.
Pour cela une une branche est créée sur un fork du repository `betagouv/beta.gouv.fr` et une pull request est effectuée depuis ce fork vers ce repository initial `betagouv/beta.gouv.fr`.

### Pourquoi utiliser un fork ?

Afin de créer une branche et faire une pull request sur un repository, on donne les droits d'accès en écriture sur ce repository via un token (`GITHUB_TOKEN`) utilisé
par le code. Pour prévenir tout problème ces droits sont donnés sur le repository "fork", et non sur le repository principal.

Il faut donc préciser ces variables d'environnement:

-   `GITHUB_TOKEN` - Le [Personal Access Token](https://github.com/settings/tokens) du compte Github utilisé pour créer les PR des nouvelles recrues. Ce token doit contenir les droits d'écriture à `GITHUB_FORK`.
-   `GITHUB_REPOSITORY` - Le repository Github qui contient les fiches des utilisateurs (par ex: `betagouv/beta.gouv.fr`). L'application n'a pas des droits d'écriture sur ce repository.
-   `GITHUB_FORK` - Le fork du `GITHUB_REPOSITORY` auquel l'application a des droits d'accès en écriture

En dev : le GITHUB_REPOSITORY est un fork de `betagouv/beta.gouv.fr`, et le GITHUB_FORK un fork de ce fork.

Pour simplifier, on peut utiliser des repos communs entre dev. Demandez a vos collègues le nom des repository à spécifer dans le .env
ainsi que les droits d'accès au resository `GITHUB_FORK`

## Scripts CRON

Les tâches CRON sont gérées par une app scalingo dédiée via le [Procfile](./Procfile)

### Configuration de production

| enabled | fréquence                                  | code                                                   | description                                                                                  |
| ------- | ------------------------------------------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| ✅      | 10:00 am mon                               | newsletterMondayReminderJob                            | Rappel mattermost newsletter 1                                                               |
| ✅      | 08:00 am thurs                             | newsletterThursdayMorningReminderJob                   | Rappel mattermost newsletter 2                                                               |
| ✅      | 02:00 pm thurs                             | newsletterThursdayEveningReminderJob                   | Rappel mattermost newsletter 3                                                               |
| ✅      | 04:00 pm thurs                             | sendNewsletterAndCreateNewOneJob                       | Envoi de la newsletter et creation d'un nouveau PAD + message mattermost                     |
| ✅      | 02:00 pm                                   | removeBetaAndParnersUsersFromCommunityTeam             | Move expired user to mattermost alumni                                                       |
| ✅      | 02:00 pm mon                               | sendReminderToUserAtDays                               | Send mattermost message to expired users (90 days)                                           |
| ❌      | 05:00 am mon                               | sendReminderToUserAtDays                               | Send mattermost message to expired users (30 days)                                           |
| ✅      | 10:00 am                                   | sendGroupDeSoutienReminder                             | Send mattermost message groupe de soutien                                                    |
| ✅      | every 8 min.                               | createUsersByEmail                                     | Create missing mattermost users and send invitation email                                    |
| ✅      | every 8 min.                               | addUsersNotInCommunityToCommunityTeam                  | Add existing users to community team if there not in                                         |
| ❌      | 08:00 am 1 th                              | reactivateUsers                                        | Reactivate mattermost accounts if any                                                        |
| ❌      | 10:00 am                                   | removeUsersFromCommunityTeam                           | Remove expired users from mattermost community team (90 days)                                |
| ❌      | 10:10 am                                   | moveUsersToAlumniTeam                                  | Add user to mattermost alumni team                                                           |
| ✅      | 05:30 pm mon                               | PostEventsFromBetaOnMattermost                         | Post event of the week from betagouv calendar                                                |
| ✅      | 08:00 am mon                               | Post event of the week from gip calendar               | undefined                                                                                    |
| ✅      | 05:00 am mon                               | createMailingListForStartups                           | Créé des mailings-list OVH pour les startups                                                 |
| ❌      | 09:30 am 1 th Feb, May, Aug and Nov        | sendEmailToStartupToUpdatePhase                        | Envoie par mail une relance pour mise à jour de la phase de la SE                            |
| ✅      | 10:00 am 1 th                              | buildCommunityBDD                                      | Met à jour la table communauté à partir des users                                            |
| ❌      | every 4 min.                               | pullRequestStateMachine                                | Verifie les pulls requests sur GitHub et envoie un email de rappel à l'équipe ou au référent |
| ❌      | 10:00 am                                   | syncBetagouvUserAPI                                    | Synchronize user info from beta.gouv.fr api with bdd                                         |
| ❌      | 10:05 am                                   | syncBetagouvStartupAPI                                 | Synchronize startup info from beta.gouv.fr api with bdd                                      |
| ✅      | 10:10 am                                   | syncMattermostUserWithMattermostMemberInfosTable       | Add new mattermost user to mattermost_member_info table                                      |
| ✅      | 10:15 am                                   | syncMattermostUserStatusWithMattermostMemberInfosTable | Get mattermost user activity info from api and sync with mattermost_member_info table        |
| ✅      | At 0h                                      | SyncFormationFromAirtable                              | Synchronise les données AirTable des formations avec la DB                                   |
| ✅      | At 0h                                      | SyncFormationInscriptionFromAirtable                   | Synchronise les données AirTable des inscriptions aux formations avec la DB                  |
| ✅      | 0 min mon                                  | Unblock blacklisted email                              | Unblock emails from MAILING_LIST_NEWSLETTER Brevo mailing-list                               |
| ❌      | every 8 min.                               | recreateEmailIfUserActive                              | Recreate email for user active again                                                         |
| ✅      | every 8 min.                               | setEmailAddressesActive                                | Add pending users to mailing-list and set email as active                                    |
| ✅      | every 8 min.                               | sendOnboardingVerificationPendingEmail                 | Envoi d'un email de relance pour les adresses en attente de validation                       |
| ✅      | every 4 min.                               | emailCreationJob                                       | Créé les emails en attente sur OVH                                                           |
| ✅      | every 4 min.                               | cron de creation de redirection                        | Créé les redirections email en attente sur OVH                                               |
| ✅      | every 4 min.                               | setEmailRedirectionActive                              | Ajoute les nouvelles redirections aux mailing-lists brevo et active l'adresse                |
| ✅      | every 4 min.                               | subscribeEmailAddresses                                | Re-inscrit les désabonnés à la mailing-list brevo incubateur                                 |
| ✅      | every 4 min.                               | unsubscribeEmailAddresses                              | Désinscrit les membres expirés de la mailing list                                            |
| ✅      | every 5 min. mon, tues, wed, thurs and fri | addGithubUserToOrganization                            | Envoi des invitations GitHub et ajout à la team GitHub/betagouv                              |
| ✅      | 06:00 pm                                   | removeGithubUserFromOrganization                       | Désinscrit les membres expirés de l'organisation GitHub                                      |
| ✅      | 08:00 am and 02:00 pm                      | deleteRedirectionsAfterQuitting                        | Supprime les redirections email OVH des utilisateurs expirés                                 |
| ✅      | 08:00 am                                   | sendJ1Email                                            | Email départ J+1                                                                             |
| ✅      | 08:00 am                                   | sendJ30Email                                           | Email départ J+30                                                                            |
| ❌      | 10:00 am                                   | deleteSecondaryEmailsForUsers                          | Supprime dans la DB les emails secondaires des membres expirés                               |
| ✅      | 03:00 pm                                   | deleteOVHEmailAcounts                                  | Supprime les emails OVH des membres expirés (30 days)                                        |
| ✅      | 03:00 pm                                   | setEmailExpired                                        | Marque en DB les emails des membres comme expirés                                            |
| ✅      | 08:00 am                                   | removeEmailsFromMailingList                            | Supprime les utilisateurs expirés des mailing-lists brevo ONBOARDING,NEWSLETTER              |
| ✅      | 02:00 pm                                   | reinitPasswordEmail                                    | Réinitialise le mot de passe email des membres expirés après 5 jours                         |
| ✅      | 10:00 am                                   | sendContractEndingMessageToUsers15days                 | Sending contract ending message to users (15 days)                                           |
| ✅      | 10:00 am                                   | sendContractEndingMessageToUsers30days                 | Sending contract ending message to users (30 days)                                           |
| ✅      | 10:00 am                                   | sendContractEndingMessageToUsers2days                  | Sending contract ending message to users (2 days)                                            |
| ❌      | At 0h                                      | pullRequestWatcher                                     | Remind user with pending GitHub pull request on author file                                  |
| ❌      | At 0h                                      | pullRequestWatcherSendEmailToTeam                      | Remind team with pending GitHub pull request on author file                                  |
| ✅      | 10:00 am 1 th                              | sendMessageToActiveUsersWithoutSecondaryEmail          | Send message to active user without secondary email to update secondary email                |
| ✅      | 15:00                                      | deleteMatomoAccount                                    | Delete matomo account                                                                        |
