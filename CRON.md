# Liste des cron jobs

| enabled | fréquence                    | code                                               | description                                                                   |
| ------- | ---------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| ✅      | `10 10 * * *`                | `syncMattermostUserWithMattermostMemberInfosTable` | Add new mattermost user to mattermost_member_info table                       |
| ❌      | `0 5 * * 1`                  | `createMailingListForStartups`                     | Créé des mailings-list OVH pour les startups                                  |
| ❌      | `30 09 01 Jan,Apr,Jul,Oct *` | `sendEmailToStartupToUpdatePhase`                  | Envoie par mail une relance pour mise à jour de la phase de la SE             |
| ✅      | `30 14 * * *`                | `syncMatomoAccounts`                               | Sync les comptes matomo des membres actifs                                    |
| ✅      | `30 14 * * *`                | `syncSentryAccounts`                               | Sync les comptes sentry des membres actifs                                    |
| ✅      | `0 0 * * 1`                  | `Unblock blacklisted email`                        | Unblock emails from MAILING_LIST_NEWSLETTER Brevo mailing-list                |
| ✅      | `0 * * * *`                  | `recreateEmailIfUserActive`                        | Recreate email for user active again                                          |
| ✅      | `0 10 1 * *`                 | `sendMessageToActiveUsersWithoutSecondaryEmail`    | Send message to active user without secondary email to update secondary email |

# Liste des jobs pg-boss

| fréquence      | topic                                              | description                                                                                                  |
| -------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `0 8 1 */3 *`  | `send-email-to-teams-to-check-on-team-composition` | Envoie un email aux équipes produits pour qu'ils vérifient la composition de leur équipe                     |
| `0 8 1 */3 *`  | `send-email-to-incubator-team`                     | Envoie un email aux équipes incubateur pour qu'ils vérifient les produits qui n'ont pas changé depuis X mois |
| `0 8-18 * * *` | `sync-dinum-emails`                                | Met à jour la table dinum_emails depuis l'API dimail                                                         |
