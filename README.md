# Espace Membre

L'espace membre de l’incubateur

## Dev de l'app Espace Membre

### Variables d'environnement

copier [`.env.development`](./.env.development) en `.env`

### Lancer en mode développement

Lancer PostgreSQL avec `docker compose up` puis démarrer l'application avec ces commandes :

```sh
» npm install # Récupère les dépendances
» npm run migrate # Applique les migrations
» npm run seed # Ajoute des utilisateurs dans la base users.
» npm run dev
   ...
   Running on port: 8100
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

### Configuration de production

| enabled | fréquence                                  | code                                                   | description                                                                                    |
| ------- | ------------------------------------------ | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| ✅      | 10:00 am mon                               | newsletterMondayReminderJob                            | Rappel mattermost newsletter 1                                                                 |
| ✅      | 08:00 am thurs                             | newsletterThursdayMorningReminderJob                   | Rappel mattermost newsletter 2                                                                 |
| ✅      | 02:00 pm thurs                             | newsletterThursdayEveningReminderJob                   | Rappel mattermost newsletter 3                                                                 |
| ✅      | 04:00 pm thurs                             | sendNewsletterAndCreateNewOneJob                       | Envoi de la newsletter et creation d'un nouveau PAD + message mattermost                       |
| ✅      | 02:00 pm                                   | removeBetaAndParnersUsersFromCommunityTeam             | Move expired user to mattermost alumni                                                         |
| ✅      | 02:00 pm mon                               | sendReminderToUserAtDays                               | Send mattermost message to expired users (90 days)                                             |
| ❌      | 05:00 am mon                               | sendReminderToUserAtDays                               | Send mattermost message to expired users (30 days)                                             |
| ✅      | 10:00 am                                   | sendGroupDeSoutienReminder                             | Send mattermost message groupe de soutien                                                      |
| ✅      | every 8 min.                               | createUsersByEmail                                     | Create missing mattermost users and send invitation email                                      |
| ✅      | every 8 min.                               | addUsersNotInCommunityToCommunityTeam                  | Add existing users to community team if there not in                                           |
| ❌      | 08:00 am 1 th                              | reactivateUsers                                        | Reactivate mattermost accounts if any                                                          |
| ❌      | 10:00 am                                   | removeUsersFromCommunityTeam                           | Remove expired users from mattermost community team (90 days)                                  |
| ❌      | 10:10 am                                   | moveUsersToAlumniTeam                                  | Add user to mattermost alumni team                                                             |
| ✅      | 05:30 pm mon                               | PostEventsFromBetaOnMattermost                         | Post event of the week from betagouv calendar                                                  |
| ✅      | 08:00 am mon                               | Post event of the week from gip calendar               | undefined                                                                                      |
| ✅      | 05:00 am mon                               | createMailingListForStartups                           | Créé des mailings-list OVH pour les startups                                                   |
| ❌      | 09:30 am 1 th Feb, May, Aug and Nov        | sendEmailToStartupToUpdatePhase                        | Envoie par mail une relance pour mise à jour de la phase de la SE                              |
| ✅      | 10:00 am 1 th                              | buildCommunityBDD                                      | Met à jour la table communauté à partir des users                                              |
| ❌      | every 4 min.                               | pullRequestStateMachine                                | Verifie les pulls requests sur GitHub et envoie un email de rappel à l'équipe ou au référent   |
| ❌      | 10:00 am                                   | syncBetagouvUserAPI                                    | Synchronize user info from beta.gouv.fr api with bdd                                           |
| ❌      | 10:05 am                                   | syncBetagouvStartupAPI                                 | Synchronize startup info from beta.gouv.fr api with bdd                                        |
| ✅      | 10:10 am                                   | syncMattermostUserWithMattermostMemberInfosTable       | Add new mattermost user to mattermost_member_info table                                        |
| ✅      | 10:15 am                                   | syncMattermostUserStatusWithMattermostMemberInfosTable | Get mattermost user activity info from api and sync with mattermost_member_info table          |
| ✅      | At 0h                                      | SyncFormationFromAirtable                              | Synchronise les données AirTable des formations avec la DB                                     |
| ✅      | At 0h                                      | SyncFormationInscriptionFromAirtable                   | Synchronise les données AirTable des inscriptions aux formations avec la DB                    |
| ✅      | 0 min mon                                  | Unblock blacklisted email                              | Unblock emails from MAILING_LIST_NEWSLETTER Brevo mailing-list                                 |
| ❌      | every 8 min.                               | recreateEmailIfUserActive                              | Recreate email for user active again                                                           |
| ✅      | every 8 min.                               | setEmailAddressesActive                                | Add pending users to mailing-list and set email as active                                      |
| ✅      | every 8 min.                               | sendOnboardingVerificationPendingEmail                 | Envoi d'un email de relance pour les adresses en attente de validation                         |
| ✅      | every 4 min.                               | emailCreationJob                                       | Créé les emails en attente sur OVH                                                             |
| ✅      | every 4 min.                               | cron de creation de redirection                        | Créé les redirections email en attente sur OVH                                                 |
| ✅      | every 4 min.                               | setEmailRedirectionActive                              | Ajoute les nouvelles redirections aux mailing-lists brevo et active l'adresse                  |
| ✅      | every 4 min.                               | subscribeEmailAddresses                                | Re-inscrit les désabonnés à la mailing-list brevo incubateur                                   |
| ✅      | every 4 min.                               | unsubscribeEmailAddresses                              | Désinscrit les membres expirés de la mailing list                                              |
| ✅      | every 5 min. mon, tues, wed, thurs and fri | addGithubUserToOrganization                            | Envoi des invitations GitHub et ajout à la team GitHub/betagouv                                |
| ✅      | 06:00 pm                                   | removeGithubUserFromOrganization                       | Désinscrit les membres expirés de l'organisation GitHub                                        |
| ✅      | 08:00 am and 02:00 pm                      | deleteRedirectionsAfterQuitting                        | Supprime les redirections email OVH des utilisateurs expirés                                   |
| ✅      | 08:00 am                                   | sendJ1Email                                            | Email départ J+1                                                                               |
| ✅      | 08:00 am                                   | sendJ30Email                                           | Email départ J+30                                                                              |
| ❌      | 10:00 am                                   | deleteSecondaryEmailsForUsers                          | Supprime dans la DB les emails secondaires des membres expirés                                 |
| ✅      | 03:00 pm                                   | deleteOVHEmailAcounts                                  | Supprime les emails OVH des membres expirés (30 days)                                          |
| ✅      | 03:00 pm                                   | setEmailExpired                                        | Marque en DB les emails des membres comme expirés                                              |
| ✅      | 08:00 am                                   | removeEmailsFromMailingList                            | Supprime les utilisateurs expirés des mailing-lists brevo ONBOARDING,NEWSLETTER                |
| ✅      | 02:00 pm                                   | reinitPasswordEmail                                    | Réinitialise le mot de passe email des membres expirés après 5 jours                           |
| ✅      | 10:00 am                                   | sendContractEndingMessageToUsers15days                 | Sending contract ending message to users (15 days)                                             |
| ✅      | 10:00 am                                   | sendContractEndingMessageToUsers30days                 | Sending contract ending message to users (30 days)                                             |
| ✅      | 10:00 am                                   | sendContractEndingMessageToUsers2days                  | Sending contract ending message to users (2 days)                                              |
| ❌      | At 0h                                      | pullRequestWatcher                                     | Remind user with pending GitHub pull request on author file                                    |
| ❌      | At 0h                                      | pullRequestWatcherSendEmailToTeam                      | Remind team with pending GitHub pull request on author file                                    |
| ✅      | 10:00 am 1 th                              | sendMessageToActiveUsersWithoutSecondaryEmail          | Send message to active user without secondary email to update secondary email                  |
| ✅      | 15:00                                      | deleteMatomoAccount                                    | Delete matomo account                                                                          |
| ✅      | 15:00                                      | deleteSentryAccount                                    | Delete sentry account                                                                          |
| ✅      | 1st monday every 3 months                  | sendEmailToTeamsToCheckOnTeamComposition               | Send recap email to startups team every 3 months                                               |
| ✅      | 1st monday every 3 months                  | sendEmailToIncubator                                   | Send recap email to incubator's team with list of startups with no update within last 3 months |

## Emails

Voir le détail dans [EMAIL.md](./EMAIL.md)

## Storybook

Nous utilisons **Storybook** principalement pour documenter l’apparence des emails, et potentiellement d'autres composants à l’avenir. Afin de garder la base de code principale propre et bien organisée, Storybook est configuré comme un **sous-module Git** dans un dépôt séparé :

👉 [https://github.com/betagouv/espace-membre-storybook](https://github.com/betagouv/espace-membre-storybook)

### Instructions d’installation

Pour initialiser et utiliser le sous-module Storybook :

```bash
git submodule init
git submodule update
cd storybook
npm install
```

Une fois dans le dossier `storybook`, vous pouvez exécuter les commandes suivantes, définies dans son `package.json` :

-   `npm run storybook` : Lance l’application Storybook — elle devrait s’ouvrir automatiquement dans votre navigateur.
-   `npm run chromatic` : Si vous avez un token Chromatic (voir ci-dessous), cette commande construit et envoie votre Storybook à Chromatic.
-   `npm run build-storybook` : Génère la version statique de Storybook.

### Chromatic

Pour activer Chromatic, créez un fichier `.env` dans le dossier `storybook` et ajoutez-y la variable d’environnement suivante :

```bash
CHROMATIC_PROJECT_TOKEN=your_token_here
```

Vous pouvez obtenir un token gratuitement en créant un projet sur [chromatic.com](https://www.chromatic.com).
