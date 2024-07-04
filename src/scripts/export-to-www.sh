#!/bin/bash

set +x
set -e

BRANCH="auto/changes-`date '+%Y%m%d_%H%M%S'`"
COMMIT="chore: db changes `date '+%Y%m%d_%H%M%S'`"

rm -rf ./beta.gouv.fr || true

# clone the fork
git clone "https://$GITHUB_TOKEN@github.com/$GITHUB_FORK"

# update beta.gouv local clone
node ./dist/src/scripts/update-local-files

cd beta.gouv.fr

# create branch, commit and upstream pull request on changes
if [[ `git status --porcelain content` ]]; then
    git checkout -b "$BRANCH"
    echo "Changes detected !"
    git add content
    
    git commit -m "$COMMIT"
    git push
    curl --location --request POST 'https://api.github.com/repos/mattneub/temp/pulls' \
        --header "Authorization: Bearer $GITHUB_TOKEN" \
        --header 'Content-Type: application/json' \
        --data-raw '{
            "base": "master",
            "head": "$BRANCH",
            "title": "$COMMIT"
        }'
else    
    echo "No changes detected"
fi;

