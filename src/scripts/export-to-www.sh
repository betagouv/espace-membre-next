#!/bin/bash

#set +x # debug
set -eo pipefail  # stop on errors, including inside pipes

BRANCH="auto/changes-`date '+%Y%m%d_%H%M%S'`"
COMMIT="chore: db changes `date '+%Y%m%d_%H%M%S'`"

rm -rf ./beta.gouv.fr || true

# clone the fork
git clone --depth 1 "https://$GITHUB_TOKEN@github.com/$GITHUB_REPOSITORY"

# update beta.gouv local clone
npx tsx ./src/scripts/update-local-files

cd beta.gouv.fr

# create branch, commit and upstream pull request on changes
if [[ `git status --porcelain content` ]]; then
    git checkout -b "$BRANCH"
    echo "Changes detected !"
    git add content
    git config --global user.name "Bot espace-membre"
    git config --global user.email "communaute@beta.gouv.fr"
    git commit -m "$COMMIT"
    git push --set-upstream origin "$BRANCH"

    # make PR from fork
    FORK_USER="$( cut -d '/' -f 1 <<< "$GITHUB_REPOSITORY" )";
    PR_JSON="$(curl -sS --fail-with-body --location --request POST "https://api.github.com/repos/$GITHUB_REPOSITORY/pulls" \
        --header "Authorization: Bearer $GITHUB_TOKEN" \
        --header 'Content-Type: application/json' \
        --data-raw "{
            \"base\": \"master\",
            \"head\": \"$FORK_USER:$BRANCH\",
            \"title\": \"$COMMIT\"
        }")"
    node -e 'console.log(JSON.parse(require("fs").readFileSync(0, "utf8")).html_url)' <<< "$PR_JSON"

    # enable auto-merge: the PR is squashed once approved (approval workflow
    # on beta.gouv.fr) and the `test` check is green. Not fatal: without it,
    # the PR waits for a manual merge.
    PR_NODE_ID="$(node -e 'console.log(JSON.parse(require("fs").readFileSync(0, "utf8")).node_id)' <<< "$PR_JSON")"
    curl -sS --fail-with-body --location --request POST "https://api.github.com/graphql" \
        --header "Authorization: Bearer $GITHUB_TOKEN" \
        --header 'Content-Type: application/json' \
        --data-raw "{
            \"query\": \"mutation(\$id: ID!) { enablePullRequestAutoMerge(input: { pullRequestId: \$id, mergeMethod: SQUASH }) { clientMutationId } }\",
            \"variables\": { \"id\": \"$PR_NODE_ID\" }
        }" || echo "Auto-merge not enabled"
    echo

else
    echo "No changes detected"
fi;



