#!/bin/sh -l
set -ex

npm run migrate

exec "$@"
