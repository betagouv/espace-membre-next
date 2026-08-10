# Liste des cron jobs

| enabled | fréquence                    | code                                            | description                                                                   |
| ------- | ---------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------- |
| ❌      | `0 5 * * 1`                  | `createMailingListForStartups`                  | Créé des mailings-list OVH pour les startups                                  |
| ❌      | `30 09 01 Jan,Apr,Jul,Oct *` | `sendEmailToStartupToUpdatePhase`               | Envoie par mail une relance pour mise à jour de la phase de la SE             |
| ✅      | `0 * * * *`                  | `recreateEmailIfUserActive`                     | Recreate email for user active again                                          |
| ✅      | `0 10 1 * *`                 | `sendMessageToActiveUsersWithoutSecondaryEmail` | Send message to active user without secondary email to update secondary email |

# Liste des jobs pg-boss

> `send-email-to-teams-to-check-on-team-composition` et `send-email-to-incubator-team` ont été retirés de pg-boss
> et sont désormais gérés par des workflows n8n (voir `docs/n8n/`).
>
> `sync-dinum-emails`, `clean-teams-members` et `sync-matrix-accounts` ont également été retirés de pg-boss :
> ce sont désormais des scripts Node.js standalone (`npm run job:*`) planifiés par le Scalingo Scheduler
> (voir `cron.json` et la section ci-dessous). Seul `create-dimail-mailbox` reste un job pg-boss (déclenché à la demande).

| fréquence         | topic                    | description                                       |
| ------------------ | ------------------------ | -------------------------------------------------- |
| _(à la demande)_   | `create-dimail-mailbox`  | Créer une boite mail Dimail pour un utilisateur    |

# Liste des jobs Scalingo Scheduler (`cron.json`)

> ⚠️ Le Scalingo Scheduler exécute les commandes en UTC (pas de gestion de fuseau horaire), contrairement à
> l'ancienne planification pg-boss qui forçait `Europe/Paris`. Les heures ci-dessous sont donc correctes en
> hiver (UTC = heure de Paris − 1h) et décalées d'une heure en été (heure d'été, UTC+2). Ces jobs ne
> s'exécutent que sur l'app dédiée `espace-membre-cron` (garde `[[ "$APP" = "espace-membre-cron" ]]`).

| fréquence (UTC) | commande                            | description                                                                      |
| ---------------- | ------------------------------------ | --------------------------------------------------------------------------------- |
| `0 3 * * *`       | `npm run job:sync-matrix-accounts`   | Indexe les comptes Matrix (Tchap) des utilisateurs via le Matrix Identity Server  |
| `0 8 * * *`       | `npm run job:clean-teams-members`    | Supprime les membres expirés des équipes incubateurs                            |
| `0 8-18 * * *`    | `npm run job:sync-dinum-emails`      | Met à jour la table dinum_emails depuis l'API dimail                            |
