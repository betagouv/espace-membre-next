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

| fréquence      | topic                                              | description                                                                                                  |
| -------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `0 8-18 * * *` | `sync-dinum-emails`                                | Met à jour la table dinum_emails depuis l'API dimail                                                         |
| `0 3 * * *`    | `sync-matrix-accounts`                             | Indexe les comptes Matrix (Tchap) des utilisateurs via le Matrix Identity Server                             |
