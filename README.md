# Espace Membre

L'espace membre de l'incubateur

## Installation et développement

Il existe deux façons de développer l'application : avec Docker (recommandé) ou en local.

### 🐳 Développement avec Docker (Recommandé)

Cette méthode est recommandée car elle garantit un environnement cohérent et isolé.

1. Prérequis
   - Docker et Docker Compose v2.x installés sur votre machine
   - Git
   - Au moins 4Go de RAM disponible pour Docker

2. Installation
   ```bash
   # Cloner le repository
   git clone https://github.com/betagouv/espace-membre-next.git
   cd espace-membre-next

   # Premier démarrage (configure tout automatiquement)
   make setup
   ```

Le processus de setup va automatiquement :
1. Créer un fichier `.env` à partir de `.env.example`
2. Construire les images Docker
3. Démarrer les conteneurs (PostgreSQL, Redis, MailDev, Application)
4. Attendre que la base de données soit prête
5. Exécuter les migrations de base de données
6. Créer les utilisateurs de test (seed)
7. Importer les données depuis beta.gouv.fr

⚠️ Important : Avant d'exécuter `make setup`, assurez-vous d'avoir au moins 4Go de RAM disponible pour Docker.

Note : Les clés API OVH et le token GitHub ne sont pas nécessaires pour le développement local car :
- L'application utilise un serveur SMTP de développement (maildev) pour les emails
- L'import des données se fait via une URL publique de GitHub
- Les interactions avec l'API OVH sont simulées en développement

Si vous avez besoin d'utiliser les services réels (optionnel) :
- Pour la gestion des emails @beta.gouv.fr : [Générer clé API OVH](#générer-clé-api-ovh)
- Pour l'accès à l'API GitHub : créer un token avec les permissions nécessaires

3. Commandes disponibles

| Commande | Description | Action |
|----------|-------------|---------|
| `make setup` | Premier démarrage | Configure l'environnement et démarre tout |
| `make dev` | Démarrage normal | Lance l'application |
| `make logs` | Voir les logs | Affiche les logs de tous les services |
| `make shell` | Accéder au shell | Ouvre un terminal dans le conteneur |
| `make clean` | Nettoyer | Supprime les conteneurs et volumes |
| `make rebuild` | Reconstruire | Reconstruit et redémarre l'application |
| `make db-reset` | Reset base de données | Réinitialise avec le seed user |
| `make init-env` | Init environnement | Configure les variables de développement |
| `make pull-data` | Sync données | Synchronise les données depuis beta.gouv.fr |

Note : La commande `make setup` :
1. Configure les variables d'environnement locales
2. Initialise la base avec le seed user
3. Synchronise les données depuis beta.gouv.fr
4. Construit et démarre les conteneurs

### 💻 Développement en local

Cette méthode est adaptée si vous préférez utiliser votre environnement local.

1. Prérequis
   - Node.js 20.x
   - PostgreSQL 14.x
   - Redis
   - Git

2. Installation
   ```bash
   # Cloner le repository
   git clone https://github.com/betagouv/espace-membre-next.git
   cd espace-membre-next

   # Installer les dépendances
   npm install

   # Configurer l'environnement
   cp .env.example .env
   # Éditer .env avec vos paramètres locaux

   # Lancer l'installation
   ./setup.sh
   ```

## Variables d'environnement

### Variables requises
- `OVH_APP_KEY` - [Obtenir les credentials OVH pour débugger](#Générer-clé-API-OVH)
- `OVH_APP_SECRET`
- `OVH_CONSUMER_KEY`
- `SESSION_SECRET` - Clé de 32 caractère aléatoires, important en prod
- `MAIL_SERVICE` - Service [géré par nodemailer](https://nodemailer.com/smtp/well-known/). Si absente, `MAIL_HOST`, `MAIL_PORT`, et `MAIL_IGNORE_TLS` seront utilisées.
- `MAIL_USER`
- `MAIL_PASS`
- `SECURE` - _true_ si https sinon _false_
- `HOSTNAME` - Par exemple _localhost_ pour le développement en local
- `CHAT_WEBHOOK_URL_SECRETARIAT` - Adresse d'envoi des notifications Mattermost
- `CHAT_WEBHOOK_URL_GENERAL` - Adresse d'envoi des notifications Mattermost
- `DATABASE_URL` - Le [string de connexion](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING) pour se connecter à Postgres
- `GITHUB_TOKEN` - Le [Personal Access Token](https://github.com/settings/tokens)
- `GITHUB_REPOSITORY` - Le repository Github (par ex: `betagouv/beta.gouv.fr`)
- `GITHUB_FORK` - Le fork du GITHUB_REPOSITORY (par ex: `test-user/beta.gouv.fr`)
- `GITHUB_ORG_ADMIN_TOKEN` - Token pour gérer les membres de la communauté

### Variables optionnelles
- `SECRETARIAT_DOMAIN` - Domaine OVH à utiliser
- `USERS_API` - API User à utiliser
- `POSTGRES_PASSWORD` - Pour l'image docker de postgres
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_IGNORE_TLS` - Configuration SMTP alternative
- `NEWSLETTER_HASH_SECRET` - Clé pour les newsletters
- `GITHUB_ORGANIZATION_NAME` - Nom de l'organization github
- `MATTERMOST_INVITE_ID` - ID d'invitation Mattermost
- `MATTERMOST_TEAM_ID` - ID de la team `Communauté`
- `MATTERMOST_BOT_TOKEN` - Token du bot mattermost
- `NEXT_PUBLIC_MATOMO_URL` - URL Matomo
- `NEXT_PUBLIC_MATOMO_SITE_ID` - ID du site Matomo

## Services disponibles en développement

Les services seront disponibles aux adresses suivantes :
- Application : http://localhost:8100
- Interface Maildev : http://localhost:1080
- Base de données : localhost:5432
- Redis : localhost:6379

### Accès à l'environnement de développement

Une fois l'application démarrée, les services sont accessibles aux adresses suivantes :

| Service | URL | Description |
|---------|-----|-------------|
| Application Web | http://localhost:8100 | Interface principale de l'application |
| MailDev | http://localhost:1080 | Interface web pour visualiser les emails |
| PostgreSQL | localhost:5432 | Base de données (user: secretariat, password: secretariat) |
| Redis | localhost:6379 | Cache et sessions (password: localpwd) |

### 📧 Service mail (Maildev)

Pour le développement, un serveur SMTP de test (Maildev) est disponible :
- Interface web : http://localhost:1080
- Serveur SMTP : localhost:1025

### 📊 Base de données

PostgreSQL est accessible :
- Avec Docker : `docker compose exec db psql -U secretariat -d secretariat`
- En local : `psql -U secretariat -d secretariat`

### 🔄 Redis

Redis est utilisé pour la gestion des sessions et le cache :
- Avec Docker : Accessible via le service 'redis'
- En local : Nécessite une installation locale de Redis

## Debug avec le serveur SMTP MailDev

[MailDev](http://maildev.github.io/maildev/) est un serveur SMTP avec une interface web conçu pour le développement et les tests.

### Avec Docker (Recommandé)
Aucune configuration n'est nécessaire, MailDev est automatiquement configuré dans l'environnement Docker. Les emails envoyés par l'application sont accessibles depuis l'interface web MailDev à l'adresse `http://localhost:1080`.

### Sans Docker
Si vous développez sans Docker, une fois [MailDev installé](http://maildev.github.io/maildev/#install), configurez les variables d'environnement suivantes :
```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_IGNORE_TLS=true
```

Tous les emails envoyés par le code de l'espace membre seront visibles depuis l'interface web de MailDev.

## Déboggage et tests

### Tests

```bash
# Avec Docker
docker compose exec web npm test

# En local
npm test
```

### Logs

```bash
# Avec Docker
docker compose logs -f [service]

# En local
npm run dev
```

### Ports exposés (Docker)

- 8100 : Application web
- 9229 : Node.js debugger
- 1080 : Interface Maildev
- 5432 : PostgreSQL
- 6379 : Redis

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
| ✅      | 15:00                                      | deleteMatomoAccount                                    | Delete matomo account                                                                        |
| ✅      | 15:00                                      | deleteSentryAccount                                    | Delete sentry account                                                                        |

## Générer clé API OVH

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

## Debug avec le serveur SMTP Maildev

[Maildev](http://maildev.github.io/maildev/) est un serveur SMTP avec une interface web conçus pour le développement et les tests.

Sans docker:
Une fois [installé](http://maildev.github.io/maildev/#install) et lancé, il suffit de mettre la variable d'environnement `MAIL_SERVICE` à `maildev` pour l'utiliser. `MAIL_USER` et `MAIL_PASS` ne sont pas nécessaires.

Avec docker:
ne pas préciser de MAIL_SERVICE, les bonnes variables d'environnement sont déjà précisées dans le docker-compose

Tous les emails envoyés par le code de l'espace membre seront visibles depuis l'interface web de Maildev (`http://localhost:1080/`).

## Debug sans notifications Mattermost

Pour certaines actions, l'espace membre envoie une notification Mattermost. En local, vous pouvez mettre les variables d'environnements `CHAT_WEBHOOK_URL_SECRETARIAT` et `CHAT_WEBHOOK_URL_GENERAL` à un service qui reçoit des requêtes POST et répond avec un `200 OK` systématiquement.

[Beeceptor](https://beeceptor.com/) permet de le faire avec une interface en ligne sans besoin de télécharger quoi que ce soit.

Sinon, certains outils gratuits comme [Mockoon](https://mockoon.com/) ou [Postman](https://www.postman.com/) permettent de créer des serveurs mock facilement aussi ([Guide Postman](https://learning.postman.com/docs/designing-and-developing-your-api/mocking-data/setting-up-mock/#creating-mock-servers-in-app)).

## Debug avec un autre domaine OVH

Lorsqu'on utilise un autre domaine OVH (par exemple, un domain bac-à-sable pour le développement), la variable `SECRETARIAT_DOMAIN` doit être renseignée. Par défaut, le domaine est `beta.gouv.fr`.

## Debug avec une autre API utilisateur

Configurer la variable d'environnement `USERS_API` (par défaut à `https://beta.gouv.fr/api/v1.6/authors.json`)

## Créer des migrations

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

## Lancer en mode développement

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

## Lancer avec docker-compose

Pour un démarrage rapide avec Docker :

1. Copier le fichier de configuration :
```bash
cp .env.example .env
```

2. Utiliser les commandes Make pour gérer l'application :

```bash
# Premier démarrage complet
# Cette commande va :
# - Récupérer les données de production depuis Scalingo
# - Construire les conteneurs Docker
# - Lancer les migrations de base de données
# - Créer les données de test (seeds)
# - Démarrer tous les services
make setup

# Démarrage normal (après le premier setup)
make dev

# Voir les logs
make logs

# Accéder au shell du conteneur
make shell

# Nettoyer l'environnement (supprime les volumes et conteneurs)
make clean

# Reconstruire l'application
make rebuild

# Réinitialiser la base de données
make db-reset

# Récupérer uniquement les données de Scalingo
make pull-data
```

Les services seront disponibles aux adresses suivantes :
- Application : http://localhost:8100
- Interface Maildev : http://localhost:1080
- Base de données : localhost:5432
- Redis : localhost:6379

Notes importantes pour le développement avec Docker :
- Le code source est monté en volume, les changements sont reflétés en temps réel
- Les dépendances Node.js sont préservées dans un volume
- Le hot-reload est activé pour le développement
- Les logs de tous les services sont disponibles via `make logs`
- La commande `make setup` inclut la récupération des données de production et la création des données de test

## Lancer avec docker sans docker-compose

-   Exemple pour développer dans un container :
    -   `docker run --rm --env-file ../.env.secretariat.dev -v $(pwd):/app -w /app -ti -p 8100 node /bin/bash` (avec vos variables d'environnement dans ../.env.secretariat.dev)

## Lancer en mode production

```
» npm run build
» npm run start
   ...
   Running on port: 8100
```

## Lancer les tests

```
» npm run test

```
