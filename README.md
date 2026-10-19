# Espace Membre

L'espace membre de l’incubateur

## Fonctionnalités

- gestion des membres et missions
- gestion des produits, incubateurs, équipes, sponsors
- gestion du compte beta:
  - adresse email & préférences de communication
  - accès aux outils (sentry, matomo)
- exploration de la communauté
- afficher les formations et évènements
- connexion via ProConnect avec double authentification, aide sur `/support`.
  Personas, parcours et règles de l'email principal : [connexion.md](connexion.md)
- tâches de maintenance (cf [Cron Jobs](#cron-jobs)) : emails,
  mattermost, brevo, github

## API v1

La documentation interactive est publique sur
[`/api/docs`](https://espace-membre.incubateur.net/api/docs), et le document
OpenAPI 3.1 qui l'alimente sur
[`/api/v1/openapi.json`](https://espace-membre.incubateur.net/api/v1/openapi.json).

Les appels s'authentifient par clef d'API, avec un en-tête
`Authorization: Bearer em1_<...>`. Une clef se crée depuis l'Espace Membre :
onglet « Clefs d'API » de sa fiche membre pour une clef personnelle, page
`/incubators/{uuid}/api-keys` pour une clef d'application. Le jeton n'est affiché
qu'une seule fois, à la création.

Chaque clef porte des portées (`members:read`, `startups:read`,
`incubators:read`, `startups:write`, `incubators:write`) et deux périmètres
indépendants, un en lecture et un en écriture. Aucune portée n'en implique une
autre : une écriture répond `204` sans corps si la clef ne porte pas la lecture
correspondante.

Le périmètre de lecture s'applique aussi aux sous-ressources : sur
`/api/v1/incubators/{id}/members`, une clef de périmètre `startup/S` atteint bien
les incubateurs de `S`, mais n'y énumère que les membres de `S`. Le chemin ouvre
l'incubateur, il n'élargit pas le périmètre.

Le fonctionnement détaillé, portées, périmètres, cycle de vie et dépannage, est
dans [`docs/api-keys.md`](./docs/api-keys.md).

Une clef sans date d'expiration reçoit deux rappels par courriel, à 90 puis à
180 jours. Ces deux paliers se comptent depuis la dernière confirmation quand il
y en a eu une, sinon depuis la création : confirmer qu'une clef sert toujours
redonne donc réellement deux paliers. La confirmation ne prolonge rien d'autre,
et ne repousse pas la révocation automatique pour inactivité, qui se compte sur
un usage réel.

## Dev de l'app Espace Membre

Un fichier [`Makefile`](./Makefile) ainsi que la partie `scripts` du
fichier [`package.json`](./package.json) recensent les commandes
utiles du projet.

### Variables d'environnement

copier [`.env.development`](./.env.development) en `.env`

`ESPACE_MEMBRE_ADMIN` liste les administrateurs de l'espace membre, sous forme
de `username` (`prenom.nom`) séparés par des virgules.

Les items de checklist marqués `restricted: true` dans
[`onboarding.yml`](./src/lib/checklists/onboarding.yml), par exemple la
participation à l'atelier d'embarquement, ne sont pas auto-déclaratifs : seuls
les administrateurs et les membres de l'équipe d'animation de la DINUM peuvent
les cocher. Cette équipe est identifiée par son `ghid`
`dinum-animation-beta-gouv-fr` dans la table `teams` — plusieurs incubateurs ont
une équipe nommée « Animation », le `ghid` est ce qui les distingue. Il n'y a
pas de variable d'environnement : l'appartenance est lue en base.

### Lancer en mode développement

Un environnement Docker Compose permet de lancer l'application et ses
dépendances ensemble :

```sh
docker compose up
```

Si vous voulez lancer l'application en local, vous devez lui fournir
une base de données accessible via une variable d'environnement `DATABASE_URL`.

### Données initiales

Une fois que votre application tourne, vous pouvez utiliser la
commande suivante pour obtenir des données initiales ; utilisez
d'abord `make sh` pour accéder à votre conteneur Docker.

```sh
npm run seed
npm run dev-import-from-www # Ajoute les données du site beta.gouv.fr (utilisateur, produits, incubateurs, ...)
```

L'application est disponible sur http://localhost:8100. Les emails envoyés par
l'application sont visibles sur le maildev http://localhost:1080.

En développement (`next dev` uniquement), la page `/login` propose une
**connexion ProConnect simulée** : saisir l'adresse principale d'un membre en
base. `FAKE_PROCONNECT_LOGIN=false` la désactive.

### Lancer les tests

```sh
npm run test
```

### Debug avec le serveur SMTP Maildev

[Maildev](http://maildev.github.io/maildev/) est un serveur SMTP avec une interface web conçu pour le développement et les tests.

Le docker-compose intègre une instance de maildev pour le développement.

Tous les emails envoyés par le code de l'espace membre seront visibles depuis l'interface web de Maildev (`http://localhost:1080/`).

## Cron Jobs

> ⚠️ Le Scalingo Scheduler exécute les commandes en UTC (pas de gestion de fuseau
> horaire), contrairement à l'ancienne planification pg-boss qui forçait
> `Europe/Paris`. Les heures ci-dessous sont donc correctes en hiver
> (UTC = heure de Paris − 1h) et décalées d'une heure en été (heure d'été, UTC+2).
> Ces jobs ne s'exécutent que sur l'app dédiée `espace-membre-cron` (garde
> `[ "$APP" = "espace-membre-cron" ]`).

Scalingo limite une app à 5 tâches cron. [`cron.json`](./cron.json) déclare donc
5 créneaux fixes, qui lancent chacun `npm run cron -- <créneau>`. Les jobs
rattachés à chaque créneau sont listés dans `CRON_SLOTS`
([`src/scripts/cron/jobs.ts`](./src/scripts/cron/jobs.ts)) : ajouter ou déplacer
un job ne touche pas `cron.json`.

Les jobs d'un créneau tournent l'un après l'autre, dans l'ordre déclaré. Un job
en échec n'empêche pas les suivants. Chaque échec part dans Sentry (tag
`cron_job`) et la commande sort en erreur si au moins un job a échoué. Un job
plus rare que son créneau doit être idempotent ou vérifier lui-même s'il doit
tourner.

| créneau           | fréquence (UTC)    | jobs                            | description                                                              |
| ----------------- | ------------------ | ------------------------------- | ------------------------------------------------------------------------ |
| `hourly`          | `0 * * * *`        | `recreate-email-if-user-active` | Recrée/réactive l'email des comptes actifs repassés en `EMAIL_SUSPENDED` |
| `business-hours`  | `0 8-18 * * *`     | `sync-dinum-emails`             | Met à jour la table `dinum_emails` depuis l'API Dimail                   |
| `nightly`         | `0 3 * * *`        | `sync-matrix-accounts`          | Indexe les comptes Matrix (Tchap) des utilisateurs                       |
| `morning`         | `0 8 * * *`        | `api-keys-maintenance`          | Révoque les clefs d'API inactives, orphelines ou bloquées, puis envoie les rappels |
|                   |                    | `clean-teams-members`           | Supprime les membres expirés des équipes incubateurs                     |
|                   |                    | `remind-legacy-email-login`     | Relance les membres pas encore passés à ProConnect (mode `transition`)   |
| `weekday-evening` | `0 18 * * MON-FRI` | `export-to-www`                 | Exporte les données vers le site beta.gouv.fr                            |

Pour lancer un job seul à la main : `npm run cron -- --job <nom>`.

Un seul job reste géré par [pg-boss](https://github.com/timgit/pg-boss), déclenché
à la demande : `create-dimail-mailbox`, qui crée une boite mail Dimail (cf
[Arrivée](#arrivée-onboarding)).

Les autres tâches de maintenance (relances avant/après mission, retrait des comptes GitHub/Matomo/Sentry...) sont gérées par des workflows n8n.

## Cycle de vie des utilisateurs

Un utilisateur est représenté par une ou plusieurs **missions** (contrats), chacune
avec une date de début et de fin. L'utilisateur est considéré **actif** tant qu'il a
au moins une mission dont la date de fin n'est pas dépassée
(cf `checkUserIsExpired` dans [`src/lib/utils.ts`](./src/lib/utils.ts)) ; il devient
**expiré** dès que sa dernière mission connue est terminée.

### Arrivée (onboarding)

```mermaid
flowchart TD
    classDef status fill:#e3e3fd,stroke:#000091,color:#000091
    classDef mail fill:#fef7da,stroke:#b34000,color:#3a3a3a
    classDef ko fill:#ffe9e9,stroke:#ce0500,color:#ce0500

    subgraph creation["1 - Création de la fiche (membre connecté)"]
        A["Formulaire de création :<br/>identité, mission(s), email personnel"] --> B{"Email valide ?"}
        B -- "@beta.gouv.fr, @ext.beta.gouv.fr,<br/>email d'admin ou email déjà utilisé" --> KO["Refusé"]:::ko
        B -- oui --> C["createMember :<br/>création user + missions<br/>événement MEMBER_CREATED"]
        C --> D{"Créateur admin ou membre<br/>de l'équipe de l'incubateur ?"}
    end

    subgraph validation["2 - Validation par l'incubateur"]
        S1(["MEMBER_VALIDATION_WAITING"]):::status
        S1 --> M1[/"Email de demande de validation<br/>à l'équipe de l'incubateur"/]:::mail
        M1 --> E["validateNewMember<br/>(admin ou équipe incubateur)<br/>événement MEMBER_VALIDATED"]
    end

    subgraph onboarding["3 - Annonce et démarrage de l'arrivée (startMemberOnboarding)"]
        S2(["EMAIL_UNSET<br/>fiche acceptée, sans email primaire"]):::status
        S2 -. "dans tous les cas,<br/>non bloquant" .-> M2[/"Email d'annonce aux équipes produit<br/>du nouveau membre"/]:::mail
        S2 --> F{"Email du service public ?"}
        F -- non --> S3(["EMAIL_CREATION_WAITING"]):::status
        S3 --> G["Job pg-boss create-dimail-mailbox<br/>onboarding: true, 5 essais"]
        G --> H["Création de la boîte Dimail<br/>prenom.nom ou prenom.nom.ext<br/>@beta.gouv.fr"]
        H --> M3[/"Email des accès à la boîte<br/>(adresse + lien d'accès temporaire au webmail,<br/>code d'invitation Dimail)<br/>sur l'email personnel"/]:::mail
        M3 --> S4(["EMAIL_VERIFICATION_WAITING<br/>email primaire = boîte @beta.gouv.fr"]):::status
        F -- oui --> I{"Email déjà utilisé<br/>par un autre membre ?"}
        I -- oui --> KO2["Refusé"]:::ko
        I -- non --> S5(["EMAIL_VERIFICATION_WAITING<br/>email primaire = email fourni"]):::status
    end

    subgraph connexion["4 - Première connexion (nouveau membre)"]
        M4[/"Invitation à se connecter via ProConnect<br/>envoyée sur l'email primaire (nouvelle boîte<br/>ou email public), sans lien de connexion<br/>événement EMAIL_VERIFICATION_WAITING_SENT"/]:::mail
        M4 --> J["Le membre ouvre sa boîte, y trouve l'invitation<br/>et se connecte avec ProConnect"]
        J --> K["Redirection vers /verify :<br/>vérifie et complète sa fiche"]
        K --> L["verifyNewMember"]
        L --> S6(["EMAIL_ACTIVE"]):::status
    end

    D -- non --> S1
    D -- oui --> S2
    E --> S2
    S4 --> M4
    S5 --> M4
```

Les nœuds arrondis sont les valeurs de `primary_email_status`, les
parallélogrammes les emails envoyés.

- Nom de la boîte créée : `prenom.nom` pour les agents publics
  (`legal_status`, ou à défaut statut `admin` de la dernière mission),
  `prenom.nom.ext` sinon. Les attributaires (domaine « Attributaire » ou type
  de membre « attributaire ») ont toujours une adresse en `.ext`.
- L'invitation ProConnect et l'email de validation sont réessayés 5 fois. Si
  l'arrivée reste bloquée (job non créé ou en échec, invitation jamais
  partie), rouvrir `/community/<username>/validate` la relance.

### Départ (offboarding)

Déclenché automatiquement à l'approche puis au passage de la date de fin de mission
(workflows n8n) :

Voir https://github.com/betagouv/n8n-workflows

### Retour d'un utilisateur (self-healing)

Si un utilisateur redevient actif (nouvelle mission) après être passé en
`EMAIL_SUSPENDED`, le job horaire `recreate-email-if-user-active`
(voir [Cron Jobs](#cron-jobs)) le détecte et :

- réactive sa boite Dimail existante (repasse `imap_active` à `yes` et le statut à
  `EMAIL_ACTIVE`) si elle existe déjà,
- sinon en crée une nouvelle via `createDimailMailboxForUser`.

### Statuts de l'email primaire (`EmailStatusCode`)

Définis dans [`src/models/member.ts`](./src/models/member.ts) :

| Statut                                              | Signification                        |
| --------------------------------------------------- | ------------------------------------ |
| `EMAIL_UNSET`                                       | Aucun email primaire défini ; statut d'une fiche acceptée dont l'arrivée démarre |
| `MEMBER_VALIDATION_WAITING`                         | Fiche en attente de validation par l'incubateur |
| `EMAIL_VERIFICATION_WAITING`                        | Adresse de connexion prête, invitation envoyée : le membre doit se connecter et vérifier sa fiche |
| `EMAIL_CREATION_WAITING` / `EMAIL_CREATION_PENDING` | Création de la boite en cours        |
| `EMAIL_ACTIVE`                                      | Boite active                         |
| `EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING`      | Boite active, mot de passe à définir |
| `EMAIL_SUSPENDED`                                   | Boite suspendue (mission terminée)   |
| `EMAIL_DELETED`                                     | Boite supprimée _(déprécié)_         |

## Droits

Les permissions sont vérifiées côté serveur (routes sous
[`src/app/api`](./src/app/api)), pas seulement côté affichage :

- **Admin** : liste de logins définie par la variable d'environnement
  `ESPACE_MEMBRE_ADMIN` (cf [`src/server/config/admin.config.ts`](./src/server/config/admin.config.ts)).
  `session.user.isAdmin` est calculé à la connexion et donne tous les droits.
- **Membre d'équipe/produit (Teams)** : peut modifier la fiche d'un autre membre
  s'il appartient à une équipe incubateur en commun avec ce membre (via ses
  produits ou ses équipes), ou s'il partage un produit avec lui et a un statut
  légal `contractuel` ou `fonctionnaire`. Logique implémentée dans
  [`src/lib/authorization/member.ts`](./src/lib/authorization/member.ts) (fonction `canEditMember`).
- **Member** : peut modifier son propre compte. L'édition d'une fiche produit est
  conditionnée à l'appartenance à une équipe d'un des incubateurs liés au produit,
  ou au statut d'agent public actif sur ce produit. Il ne peut pas modifier la
  fiche d'un autre membre en dehors du cas ci-dessus.
- **Anonymous** : aucun accès aux pages privées (redirection vers `/login`).

### Matrice des droits

Le rôle ne suffit pas à décrire les droits : un membre ordinaire en tire du
**rattachement au produit**, par son équipe d'incubateur ou par sa mission. Les
deux dernières lignes ne sont donc pas des rôles mais des situations, qui
s'ajoutent à « Member ».

| Situation | Inviter un membre | Modifier mon compte | Modifier un membre | Éditer une fiche produit | Clef perso. lecture | Clef perso. écriture | Clef d'application |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ global inclus | ✅ |
| Équipe d'un incubateur lié | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ incubateur et ses produits | ✅ son incubateur, si vivant |
| Agent public en mission sur le produit | ✅ | ✅ | ✅ un membre du même produit | ✅ ce produit | ✅ | ✅ ce produit seulement | ❌ |
| Member sans rattachement | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Anonymous | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

Trois précisions qui évitent les mauvaises surprises.

**La lecture est libre.** N'importe quel membre peut créer une clef de périmètre
global en lecture, c'est une décision assumée : l'espace membre n'a pas de donnée
dont la lecture soit réservée entre membres. La liste de périmètres proposée au
formulaire ne décrit donc pas un droit, seulement les rattachements vivants de la
personne, pour l'aider à se restreindre.

**« Agent public en mission »** veut dire trois conditions cumulées : une mission
commencée et non terminée sur ce produit, une mission sans date de fin comptant
comme ouverte donc vivante, et un `legal_status` valant `fonctionnaire` ou
`contractuel`. Un membre sans statut déclaré, cas de tout compte jamais vérifié,
ne remplit jamais cette ligne.

**L'écriture sur un incubateur passe uniquement par l'équipe**, jamais par une
mission, et un périmètre de clef de nature produit ne l'ouvre pas non plus : la
portée `incubators:write` exige un périmètre global ou incubateur. Créer une clef
d'application demande en plus de porter une mission non expirée : siéger dans
l'équipe ne suffit pas si toutes les missions sont terminées.

Toutes les décisions d'accès vivent dans
[`src/lib/authorization/`](./src/lib/authorization/) : les prédicats `can*`
décident quoi afficher, les gardes `assertCan*` jettent une `AuthorizationError`
et sont appelées par les server actions.

Trois variables d'environnement pilotent les clefs d'API, à côté de
`ESPACE_MEMBRE_ADMIN` : `API_KEYS_CREATION_DISABLED` (bloque la création),
`API_KEYS_AUTH_DISABLED` (coupe-circuit d'incident, répond 503 sur toute
l'API v1) et `API_KEYS_BLOCKED_USERS` (liste d'usernames dont les clefs
personnelles sont refusées, relue à chaque requête).

## Diagramme de flux

```mermaid
graph LR

Internet-->App

subgraph Scalingo
PostgreSQL-->App
PostgreSQL-->Cron
end

App-->ProConnect
App-->Crisp
App-->Brevo

Cron-->Dimail
Cron-->Tchap
```
