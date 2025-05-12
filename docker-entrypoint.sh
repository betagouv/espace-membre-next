#!/bin/sh -l
set -ex

echo "[docker-entrypoint] migrating the database..."
npm run migrate
echo "[docker-entrypoint] done.migrating the database..."

exec "$@"
