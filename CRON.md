# Liste des cron jobs

| enabled | fréquence | code | description |
|---------|-----------|------|-------------|
| ✅ | `0 0 10 * * 3` | `newsletterFirstReminderJob` | Rappel mattermost newsletter 1 |
| ✅ | `0 0 8 * * 2` | `newsletterSecondReminderJob` | Rappel mattermost newsletter 2 |
| ✅ | `0 16 * * 2` | `sendNewsletterAndCreateNewOneJob` | Envoi de la newsletter et creation d'un nouveau PAD + message mattermost |
| ✅ | `0 0 14 * * *` | `removeBetaAndParnersUsersFromCommunityTeam` | Move expired user to mattermost alumni |
| ✅ | `0 0 14 * * 1` | `sendReminderToUserAtDays` | Send mattermost message to expired users (90 days) |
| ❌ | `0 0 5 * * 1` | `sendReminderToUserAtDays` | Send mattermost message to expired users (30 days) |
| ✅ | `0 0 10 * * *` | `sendGroupDeSoutienReminder` | Send mattermost message groupe de soutien |
| ✅ | `0 */8 * * * *` | `createUsersByEmail` | Create missing mattermost users and send invitation email |
| ✅ | `0 */8 * * * *` | `addUsersNotInCommunityToCommunityTeam` | Add existing users to community team if there not in |
| ❌ | `0 0 8 1 * *` | `reactivateUsers` | Reactivate mattermost accounts if any |
| ❌ | `0 0 10 * * *` | `removeUsersFromCommunityTeam` | Remove expired users from mattermost community team (90 days) |
| ❌ | `0 10 10 * * *` | `moveUsersToAlumniTeam` | Add user to mattermost alumni team |
| ✅ | `0 30 17 * * 1` | `PostEventsFromBetaOnMattermost` | Post event of the week from betagouv calendar |
| ✅ | `0 0 8 * * 1` | `Post event of the week from gip calendar` |  |
| ✅ | `0 0 5 * * 1` | `createMailingListForStartups` | Créé des mailings-list OVH pour les startups |
| ❌ | `30 09 01 Jan,Apr,Jul,Oct *` | `sendEmailToStartupToUpdatePhase` | Envoie par mail une relance pour mise à jour de la phase de la SE |
| ❌ | `0 15 19 * * *` | `deleteMatomoAccount` | Supprime les comptes matomos des membres expirés (30 days) |
| ❌ | `0 45 15 * * *` | `deleteSentryAccount` | Supprime les comptes sentry des membres expirés (30 days) |
| ✅ | `0 30 14 * * *` | `syncMatomoAccounts` | Sync les comptes matomo des membres actifs |
| ✅ | `0 30 14 * * *` | `syncSentryAccounts` | Sync les comptes sentry des membres actifs |
| ✅ | `0 10 10 * * *` | `syncMattermostUserWithMattermostMemberInfosTable` | Add new mattermost user to mattermost_member_info table |
| ✅ | `0 15 10 * * *` | `syncMattermostUserStatusWithMattermostMemberInfosTable` | Get mattermost user activity info from api and sync with mattermost_member_info table |
| ✅ | `0 0 * * *` | `SyncFormationFromAirtable` | Synchronise les données AirTable des formations avec la DB |
| ✅ | `0 0 * * *` | `SyncFormationInscriptionFromAirtable` | Synchronise les données AirTable des inscriptions aux formations avec la DB |
| ✅ | `0 0 0 * * 1` | `Unblock blacklisted email` | Unblock emails from MAILING_LIST_NEWSLETTER Brevo mailing-list |
| ✅ | `0 */8 * * * *` | `recreateEmailIfUserActive` | Recreate email for user active again |
| ✅ | `0 */8 * * * *` | `setEmailAddressesActive` | Add pending users to mailing-list and set email as active |
| ✅ | `0 */2 * * * *` | `sendOnboardingVerificationPendingEmail` | Envoi d'un email de relance pour les adresses en attente de validation |
| ✅ | `0 */4 * * * *` | `emailCreationJob` | Créé les emails en attente sur OVH |
| ✅ | `0 */4 * * * *` | `cron de creation de redirection` | Créé les redirections email en attente sur OVH |
| ✅ | `0 */4 * * * *` | `setEmailRedirectionActive` | Ajoute les nouvelles redirections aux mailing-lists brevo et active l'adresse |
| ✅ | `0 */4 * * * *` | `subscribeEmailAddresses` | Re-inscrit les désabonnés à la mailing-list brevo incubateur |
| ✅ | `0 */4 * * * *` | `unsubscribeEmailAddresses` | Désinscrit les membres expirés de la mailing list |
| ✅ | `0 */5 * * * 1-5` | `addGithubUserToOrganization` | Envoi des invitations GitHub et ajout à la team GitHub/betagouv |
| ✅ | `0 0 18 * * *` | `removeGithubUserFromOrganization` | Désinscrit les membres expirés de l'organisation GitHub |
| ✅ | `0 0 8,14 * * *` | `deleteRedirectionsAfterQuitting` | Supprime les redirections email OVH des utilisateurs expirés |
| ✅ | `0 0 8 * * *` | `sendJ1Email` | Email départ J+1 |
| ✅ | `0 0 8 * * *` | `sendJ30Email` | Email départ J+30 |
| ❌ | `0 0 10 * * *` | `deleteSecondaryEmailsForUsers` | Supprime dans la DB les emails secondaires des membres expirés |
| ✅ | `0 0 15 * * *` | `deleteOVHEmailAcounts` | Supprime les emails OVH des membres expirés (30 days) |
| ✅ | `0 0 15 * * *` | `setEmailExpired` | Marque en DB les emails des membres comme expirés |
| ✅ | `0 0 8 * * *` | `removeEmailsFromMailingList` | Supprime les utilisateurs expirés des mailing-lists brevo ONBOARDING,NEWSLETTER |
| ✅ | `0 0 14 * * *` | `reinitPasswordEmail` | Réinitialise le mot de passe email des membres expirés après 5 jours |
| ✅ | `0 0 10 * * *` | `sendContractEndingMessageToUsers15days` | Sending contract ending message to users (15 days) |
| ✅ | `0 0 10 * * *` | `sendContractEndingMessageToUsers30days` | Sending contract ending message to users (30 days) |
| ✅ | `0 0 10 * * *` | `sendContractEndingMessageToUsers2days` | Sending contract ending message to users (2 days) |
| ✅ | `0 10 1 * *` | `sendMessageToActiveUsersWithoutSecondaryEmail` | Send message to active user without secondary email to update secondary email |

# Liste des jobs pg-boss

| fréquence | topic | description |
|-----------|--------|--------|
| `0 8 1 */3 *` | `send-email-to-teams-to-check-on-team-composition` | `Envoie un email aux équipes produits pour qu'ils vérifient la composition de leur équipe` |
| `0 8 1 */3 *` | `send-email-to-incubator-team` | `Envoie un email aux équipes incubateur pour qu'ils vérifient les produits qui n'ont pas changé depuis X mois` |
