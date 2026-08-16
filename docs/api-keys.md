# Clefs d'API

Documentation interactive sur [`/api/docs`](https://espace-membre.incubateur.net/api/docs),
document OpenAPI sur [`/api/v1/openapi.json`](https://espace-membre.incubateur.net/api/v1/openapi.json).
Cette page-ci décrit le modèle de clefs, pas les endpoints.

## Deux natures de clefs

Une **clef personnelle** agit au nom d'une personne et meurt avec elle : dès que
le porteur n'a plus de mission en cours, l'authentification la refuse. Elle se
crée depuis l'onglet « Clefs d'API » de sa fiche membre.

Une **clef d'application** n'a pas de porteur humain. Elle appartient à un
incubateur, survit aux départs, et se crée depuis `/incubators/{uuid}/api-keys`.
Toute l'équipe vivante de l'incubateur est prévenue de sa création et reçoit ses
rappels. Sans incubateur porteur, c'est une clef d'organisation, réservée aux
admins.

Qui peut créer quoi : [matrice des droits du README](../README.md#matrice-des-droits).
Une clef ne crée jamais une clef, il n'y a pas de scope de gestion.

## Le jeton

```
Authorization: Bearer em1_<43 caractères>
```

Il n'est **affiché qu'une seule fois**, à la création. Seul son hash est stocké :
la base ne contient jamais le jeton en clair et personne ne peut le retrouver.
Perdu, il faut révoquer la clef et en recréer une.

Reste visible ensuite le **prefix**, `em1_` plus huit caractères, de quoi
reconnaître une clef dans un tableau ou un courriel. C'est le seul identifiant
de clef qui apparaît dans les logs et les événements.

## Portées

```
members:read   startups:read   incubators:read   startups:write   incubators:write
```

Énumération fermée, pas de wildcard. Les standards produit sont couverts par
`startups:write`.

**Aucune portée n'en implique une autre** : une écriture répond `204` sans corps
si la clef ne porte pas la lecture correspondante.

## Périmètres

Chaque clef porte deux périmètres indépendants, un en lecture et un en écriture,
parce que la règle est asymétrique.

| | Comment on l'obtient |
| --- | --- |
| Lecture, y compris global | tout membre, sans condition |
| Écriture sur un incubateur | appartenir à une équipe de cet incubateur |
| Écriture sur un produit | équipe d'un incubateur lié, ou mission en cours dessus avec un statut d'agent public |
| Écriture globale | admins |

La lecture est libre parce que l'espace membre n'a pas de donnée réservée entre
membres. La liste proposée au formulaire ne décrit donc pas un droit : elle liste
les rattachements vivants, pour aider à se restreindre. En écriture, elle ne
propose que ce qui sera réellement accepté, et disparaît si rien ne l'est.

Un périmètre produit n'ouvre jamais `incubators:write`, l'inverse est vrai. Les
périmètres sont stockés en **uuid** : renommer un ghid n'invalide aucune clef.

## Cycle de vie

L'expiration est facultative. Sans elle, la clef vit jusqu'à révocation, et
reçoit **deux rappels par courriel, à 90 puis 180 jours**, comptés depuis la
dernière confirmation. Confirmer redonne donc deux paliers. Les liens du courriel
ne confirment ni ne révoquent au chargement : ils mènent à une page où le geste
reste à faire, parce que les passerelles de messagerie déréférencent les liens
pour analyse. Un rappel sans réponse ne révoque rien.

Un balayage quotidien à 07:30 révoque, avec le motif dans `revoked_reason` :

| `unused` | 180 jours sans usage, ou sans usage depuis la création |
| --- | --- |
| `blocked_owner` | porteur listé dans `API_KEYS_BLOCKED_USERS` |
| `perimeter_gone` | l'incubateur ou le produit du périmètre a été supprimé |

## Erreurs

RFC 9457, `application/problem+json`, avec un `type` en URI stable.

| Type | Statut | Cause la plus fréquente |
| --- | --- | --- |
| `unauthorized` | 401 | jeton absent, inconnu, révoqué, expiré, ou porteur bloqué ou expiré |
| `auth_disabled` | 503 | `API_KEYS_AUTH_DISABLED` |
| `insufficient_scope` | 403 | portée manquante pour cette opération |
| `out_of_perimeter` | 403 | la ressource existe mais sort du périmètre |
| `not_found` | 404 | l'identifiant ne désigne rien |
| `method_not_allowed` | 405 | méthode non exposée |
| `unsupported_media_type` | 415 | écriture sans le bon `Content-Type` |
| `invalid_request` | 422 | corps ou paramètre invalide, avec pointeur JSON |
| `conflict` | 409 | l'écriture viole une contrainte d'intégrité |

Sur une **collection**, un périmètre restreint ne rend jamais 403, il réduit la
liste. Le 403 est réservé aux ressources unitaires : les ghid étant publics sur
beta.gouv.fr, un 404 masqué ne protégerait rien.

Un `PATCH` exige `application/merge-patch+json`, un `PUT` exige
`application/json`.

## Pagination

`?limit=` vaut 50 par défaut, 100 au maximum. `?offset=` commence à 0. Les deux
sont bornés : au-delà c'est un 422, pas un 500. `meta.total` porte sur le même
ensemble que la page, périmètre et filtres compris.

## Variables d'environnement

| Variable | Effet |
| --- | --- |
| `API_KEYS_CREATION_DISABLED` | bloque la création de nouvelles clefs |
| `API_KEYS_AUTH_DISABLED` | répond 503 sur toute l'API v1 |
| `API_KEYS_BLOCKED_USERS` | usernames dont les clefs personnelles sont refusées |

`API_KEYS_BLOCKED_USERS` est relue à chaque requête : elle prend effet
immédiatement, sans attendre le balayage.

## Traçabilité

Quatre événements, tous avec le prefix du jeton et jamais le jeton :
`API_KEY_CREATED`, `API_KEY_REVOKED`, `API_KEY_CONFIRMED`,
`API_KEY_AUTO_REVOKED`. La création d'une clef personnelle est rattachée à son
porteur, donc visible dans l'historique de sa fiche.

## Où est le code

| Sujet | Fichier |
| --- | --- |
| Authentification et erreurs | [`src/lib/api/withApiV1.ts`](../src/lib/api/withApiV1.ts) |
| Jeton, hash, prefix | [`src/lib/api-keys/token.ts`](../src/lib/api-keys/token.ts) |
| Décisions d'autorisation | [`src/lib/authorization/apiKey.ts`](../src/lib/authorization/apiKey.ts) |
| Périmètres proposés au formulaire | [`src/lib/api-keys/perimeterOptions.ts`](../src/lib/api-keys/perimeterOptions.ts) |
| Périmètres appliqués en SQL | [`src/lib/api/perimeter.ts`](../src/lib/api/perimeter.ts) |
| Balayage et rappels | [`src/server/queueing/workers/api-keys-maintenance.ts`](../src/server/queueing/workers/api-keys-maintenance.ts) |
| Document OpenAPI | [`src/lib/openapi.ts`](../src/lib/openapi.ts) |

Deux règles à connaître avant d'écrire une requête sur `api_keys` : aucun listing
ne sélectionne `token_hash`, et les filtres de périmètre s'écrivent en `EXISTS`,
jamais en `innerJoin`, une jointure dupliquant les produits co-incubés.

Le plan d'origine et ses arbitrages sont dans `.claude/docs/PLAN-api-v1-clefs.md`.

## Recette locale

```bash
npm run seed:api-key-profiles
```

Seize profils couvrant les combinaisons de mission et d'équipe, additifs,
`--clean` pour défaire. La table des périmètres attendus par profil est
verrouillée par `__tests__/api-keys-perimeter-matrix.spec.ts`.
