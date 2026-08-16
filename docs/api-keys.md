# Clefs d'API

Comment fonctionnent les clefs d'API de l'espace membre, côté usage et côté code.
La documentation interactive de l'API elle-même vit ailleurs, sur
[`/api/v1/docs`](https://espace-membre.incubateur.net/api/v1/docs), alimentée par
[`/api/v1/openapi.json`](https://espace-membre.incubateur.net/api/v1/openapi.json).

## Deux natures de clefs

Une **clef personnelle** appartient à une personne et agit en son nom. Elle meurt
avec elle : dès que le porteur n'a plus de mission en cours, l'authentification
la refuse, sans attendre le balayage quotidien. Elle se crée depuis l'onglet
« Clefs d'API » de sa fiche membre.

Une **clef d'application** n'a pas de porteur humain. Elle appartient à un
incubateur, survit aux départs, et se crée depuis `/incubators/{uuid}/api-keys`.
Toute l'équipe vivante de l'incubateur est prévenue de sa création et reçoit ses
rappels. Une clef d'application sans incubateur porteur est une clef
d'organisation, réservée aux admins, dont les rappels partent aux admins.

Qui peut créer quoi est résumé dans la matrice des droits du
[README](../README.md#matrice-des-droits). Deux points s'y ajoutent : créer une
clef d'application demande d'être *vivant* au sens de `isIncubatorLead`, donc de
porter une mission non expirée, et **une clef ne crée jamais une clef**, il n'y a
pas de portée de gestion.

## Le jeton

Format `em1_` suivi de 32 octets aléatoires en base64url, soit 43 caractères dans
l'alphabet `[A-Za-z0-9_-]`. Il s'envoie en en-tête :

```
Authorization: Bearer em1_<...>
```

Il n'est **affiché qu'une seule fois**, à la création. Ce n'est pas une règle
d'affichage mais une propriété structurelle : seul son condensat est stocké, la
base ne contient jamais le jeton clair, et personne ne peut le retrouver. Si tu
le perds, révoque la clef et recrée-la.

Ce qui reste visible ensuite est le **préfixe**, `em1_` plus huit caractères,
suffisant pour reconnaître une clef dans un tableau ou dans un courriel sans
jamais exposer le secret. C'est le seul identifiant de clef qui apparaît dans les
journaux et les événements.

## Portées

Cinq portées, énumération fermée, grammaire `ressource:action` :

```
members:read   startups:read   incubators:read   startups:write   incubators:write
```

Pas de joker, pas de portée admin. Les standards produit sont couverts par
`startups:write`, sans portée dédiée.

**Aucune portée n'en implique une autre.** Une écriture répond `204` sans corps
si la clef ne porte pas la lecture correspondante. C'est délibéré : une clef
d'intégration qui n'a besoin que d'écrire ne doit pas pouvoir lire.

## Périmètres

Chaque clef porte **deux périmètres indépendants**, un en lecture et un en
écriture, parce que la règle est asymétrique.

**En lecture, tout membre peut demander ce qu'il veut, périmètre global inclus.**
L'espace membre n'a pas de donnée dont la lecture soit réservée entre membres.
La liste proposée par le formulaire ne décrit donc pas un droit : elle liste tes
rattachements *vivants*, pour t'aider à te restreindre. Un incubateur que tu as
quitté n'y figure plus, il reste lisible en périmètre global.

**En écriture, la règle est stricte et pas symétrique.** Un périmètre incubateur
s'obtient par l'appartenance à une équipe de cet incubateur, jamais par une
mission. Un périmètre produit s'obtient par l'appartenance à une équipe d'un
incubateur lié au produit, ou par une mission en cours dessus avec un
`legal_status` d'agent public. Un périmètre global en écriture est réservé aux
admins.

Conséquence à connaître : un périmètre de nature produit n'ouvre **jamais**
`incubators:write`, et le schéma de création le refuse plutôt que de livrer une
portée muette. L'inverse est vrai, un périmètre incubateur ouvre l'écriture de
ses produits.

Le formulaire ne propose en écriture que ce qui sera réellement accepté : la
liste est filtrée par la fonction d'autorisation elle-même, elles ne peuvent donc
pas diverger. Si rien ne t'est ouvert en écriture, les cases correspondantes
disparaissent.

Les périmètres sont stockés en **uuid**, jamais en ghid : un produit ou un
incubateur peut être renommé sans invalider les clefs. Le ghid n'apparaît qu'à
l'affichage, et dans le champ `meta.perimeter` de chaque réponse.

## Cycle de vie

`last_used_at` est mis à jour à chaque requête, étranglé à l'heure : sans effet
sur un seuil à 180 jours, et sans écriture inutile.

Une clef peut porter une **date d'expiration**, facultative. Sans elle, la clef
vit jusqu'à révocation, et c'est le cas que les rappels viennent couvrir.

**Deux rappels par courriel, à 90 puis à 180 jours**, uniquement pour les clefs
sans expiration. Ils se comptent depuis `max(created_at, confirmed_at)` : une
confirmation redonne donc réellement deux paliers. Le lien du courriel ne
confirme ni ne révoque **au chargement**, il mène à une page où le geste reste à
faire ; les passerelles de messagerie déréférencent les liens pour analyse, un
lien destructeur en GET serait déclenché par un robot avant lecture. Un rappel
sans réponse ne révoque jamais rien.

Un balayage quotidien à 07:30 révoque automatiquement, avec le motif inscrit dans
`revoked_reason` :

| Motif | Déclencheur |
| --- | --- |
| `unused` | 180 jours sans usage, ou sans usage depuis la création |
| `blocked_owner` | porteur listé dans `API_KEYS_BLOCKED_USERS` |
| `perimeter_gone` | l'incubateur ou le produit du périmètre a été supprimé |

La révocation manuelle passe par l'écran de gestion et enregistre qui l'a faite.
Une révocation est **idempotente** : une clef déjà révoquée garde sa révocation
d'origine.

## Ce qui refuse une clef, et pourquoi

Les erreurs suivent la RFC 9457, `application/problem+json`, avec un `type` en
URI stable.

| Type | Statut | Cause la plus fréquente |
| --- | --- | --- |
| `unauthorized` | 401 | jeton absent, inconnu, révoqué, expiré, ou porteur bloqué ou expiré |
| `auth_disabled` | 503 | `API_KEYS_AUTH_DISABLED`, coupe-circuit d'incident |
| `insufficient_scope` | 403 | la clef ne porte pas la portée exigée par l'opération |
| `out_of_perimeter` | 403 | la ressource existe mais sort du périmètre de la clef |
| `not_found` | 404 | l'identifiant ne désigne rien |
| `method_not_allowed` | 405 | méthode non exposée sur cette ressource |
| `unsupported_media_type` | 415 | écriture sans le bon `Content-Type` |
| `invalid_request` | 422 | corps ou paramètre invalide, avec pointeur JSON |
| `conflict` | 409 | l'écriture viole une contrainte d'intégrité |

Sur une **collection**, un périmètre restreint ne rend jamais 403 : il réduit la
liste. Le 403 est réservé aux ressources unitaires, et il est préféré au 404
masqué parce que les ghid sont publics sur beta.gouv.fr : un 404 ne protégerait
rien et mentirait au client.

Une écriture exige `application/merge-patch+json` pour un `PATCH`, et
`application/json` pour un `PUT`.

## Pagination

`?limit=` vaut 50 par défaut et 100 au maximum, `?offset=` commence à 0. Les deux
sont bornés : au-delà, la réponse est un 422 et non un 500. Le total renvoyé dans
`meta.total` porte sur **le même ensemble que la page**, périmètre et filtres
compris ; il ne divulgue donc jamais le cardinal réel de la base.

## Variables d'environnement

| Variable | Effet |
| --- | --- |
| `API_KEYS_CREATION_DISABLED` | bloque la création de nouvelles clefs |
| `API_KEYS_AUTH_DISABLED` | coupe-circuit, répond 503 sur toute l'API v1 |
| `API_KEYS_BLOCKED_USERS` | usernames dont les clefs personnelles sont refusées |

`API_KEYS_BLOCKED_USERS` est **relue à chaque requête** : c'est le levier
d'incident immédiat, il prend effet sans attendre le balayage. La révocation
qu'inscrit ensuite le job n'est que la trace.

## Traçabilité

Quatre événements sont écrits, tous avec le préfixe du jeton et jamais le jeton :
`API_KEY_CREATED`, `API_KEY_REVOKED`, `API_KEY_CONFIRMED` et
`API_KEY_AUTO_REVOKED`. La création d'une clef personnelle est rattachée à son
porteur, donc visible dans l'historique de sa fiche membre.

## Le code, si tu dois y toucher

| Sujet | Où |
| --- | --- |
| Authentification et filet à erreurs | [`src/lib/api/withApiV1.ts`](../src/lib/api/withApiV1.ts) |
| Jeton, condensat, préfixe | [`src/lib/api-keys/token.ts`](../src/lib/api-keys/token.ts) |
| Décisions d'autorisation | [`src/lib/authorization/apiKey.ts`](../src/lib/authorization/apiKey.ts) |
| Listes de périmètres du formulaire | [`src/lib/api-keys/perimeterOptions.ts`](../src/lib/api-keys/perimeterOptions.ts) |
| Application d'un périmètre en SQL | [`src/lib/api/perimeter.ts`](../src/lib/api/perimeter.ts) |
| Balayage et rappels | [`src/server/queueing/workers/api-keys-maintenance.ts`](../src/server/queueing/workers/api-keys-maintenance.ts) |
| Document OpenAPI | [`src/lib/openapi.ts`](../src/lib/openapi.ts) |

Deux règles du module valent d'être connues avant d'écrire une requête. Aucune
requête de listing ne sélectionne `token_hash`, et aucune ne fait de `selectAll()`
sur `api_keys` : `findApiKeyByHash` est le seul endroit qui touche cette colonne,
en comparaison, jamais en projection. Et les filtres de périmètre s'écrivent en
`EXISTS`, jamais en `innerJoin` : une jointure dupliquerait les produits
co-incubés, et `DISTINCT` est impossible sur des colonnes json.

Le plan d'origine et ses arbitrages sont dans
`.claude/docs/PLAN-api-v1-clefs.md`.

## Profils de recette

Un script crée seize profils couvrant les combinaisons de mission et d'équipe,
pour comparer en local ce que chaque situation propose comme périmètres :

```bash
npm run seed:api-key-profiles
```

Il est additif et n'écrase rien hors du préfixe `qa-`, et `--clean` le défait.
La table des périmètres attendus est verrouillée par
`__tests__/api-keys-perimeter-matrix.spec.ts`, qui fait foi.
