# Connexion par email (lien magique), temporaire

La connexion à l'espace membre passe par ProConnect avec double authentification (MFA). Ce module garde l'ancienne connexion par lien magique le temps de migrer les comptes existants. Il est conçu pour être supprimé d'un bloc.

## Phases

La phase est choisie par `LEGACY_EMAIL_LOGIN_MODE`, à changer sur Scalingo puis redémarrer l'app.

| Mode         | Qui peut se connecter par email                                                                                                  |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `transition` | Fiches créées avant `LEGACY_EMAIL_LOGIN_CUTOFF_DATE` qui ne se sont jamais connectées avec ProConnect + MFA, plus les exceptions |
| `exceptions` | Uniquement les membres autorisés par un admin (fiche membre, "Actions admin"), pour une durée de 1 à 30 jours                    |
| `off`        | Personne. C'est aussi la valeur par défaut si la variable est absente ou invalide                                                |

Variables :

- `LEGACY_EMAIL_LOGIN_MODE` : `transition`, `exceptions` ou `off`.
- `LEGACY_EMAIL_LOGIN_CUTOFF_DATE` : date ISO. Obligatoire en `transition`, sinon le mode retombe sur `off`. À fixer à la date de mise en prod.
- `LEGACY_EMAIL_LOGIN_END_DATE` : date ISO de fin de la transition. Elle est affichée aux membres et sert au rappel hebdomadaire, qui ne part pas sans elle.

Dès qu'un membre se connecte avec ProConnect + MFA (événement `login.proconnect_mfa`), le lien magique se ferme pour lui.

Le job `job:remind-legacy-email-login` (cron du lundi `0 9 * * MON`, en UTC) écrit aux comptes pas encore migrés, uniquement en `transition`. Pour une adresse principale en `@ext.beta.gouv.fr`, que ProConnect refuse, il indique l'alias `@beta.gouv.fr` du membre. Sans alias, le membre est sauté jusqu'à la migration des adresses ext vers `.ext@beta.gouv.fr`.

`npm run report:legacy-email-login` (lecture seule) compte les membres actifs pas encore migrés par catégorie. Avec `--list`, il liste ceux qui sont à risque à la coupure.

Au déploiement de la PR, faire tourner `SESSION_SECRET` : les sessions ouvertes avant, par ProConnect sans MFA ou par email, restent sinon valides 7 jours. Au passage en `off`, faire tourner `SESSION_SECRET` pour invalider les sessions ouvertes par email (elles durent 7 jours).

## Données

Tout passe par `user_events`, sans colonne dédiée :

- `login.proconnect_mfa` : dernière connexion ProConnect avec MFA (écrit par `authoptions.ts`, conservé après suppression du module).
- `legacy_email_login.allowed_until` : exception du support, la colonne `date` porte la date d'expiration.
- `legacy_email_login.reminded` : date du dernier rappel envoyé.

## Supprimer la feature

1. Supprimer ce dossier, `src/components/LegacyEmailLogin/`, `src/app/(public)/signin/`, `src/scripts/remind-legacy-email-login.ts`, `src/scripts/legacy-email-login-report.ts`, `e2e/legacy-email-login.spec.ts` et les templates `LoginEmail/` et `LegacyEmailLoginReminder/`.
2. Retirer chaque bloc marqué `legacy-email-login` : `git grep -n "legacy-email-login"`.
3. Retirer `signin` du matcher de `src/middleware.ts` (pas de marqueur possible dans la regex).
4. Retirer le job de `cron.json`, les scripts de `package.json`, les variables de `.github/workflows/playwright.yml`, et les variables `LEGACY_EMAIL_LOGIN_*` de `.env.development` et de Scalingo.
5. Migration : supprimer la table `verification_tokens` et les lignes `user_events` dont `field_id` commence par `legacy_email_login.`.
