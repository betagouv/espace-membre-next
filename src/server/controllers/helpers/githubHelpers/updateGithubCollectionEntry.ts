import {
    createGithubBranch,
    createGithubFile,
    getGithubBranch,
    getGithubFile,
    getPullRequest,
    getGithubMasterSha,
    makeGithubPullRequest,
    PRInfo,
} from "@/lib/github";
import { createBranchName } from "./createBranchName";
import {
    GithubAuthorChange,
    GithubAuthorMissionChange,
    GithubBetagouvFile,
    GithubStartupChange,
} from "./githubEntryInterface";
import { updateFileOnBranch } from "./createGithubCollectionEntry";
import { ConversationsMessageFile } from "@sendinblue/client";
import config from "@/server/config";

async function updateGithubCollectionEntry(
    name: string,
    path: string,
    changes:
        | GithubAuthorChange
        | GithubStartupChange
        | GithubAuthorMissionChange,
    mainContent?: string
): Promise<PRInfo> {
    const branch = createBranchName(name);
    console.log(`Début de la mise à jour de la fiche pour ${name}...`);

    return await getGithubMasterSha()
        .then((response) => {
            const { sha } = response.data.object;
            console.log("SHA du master obtenu");
            return createGithubBranch(sha, branch);
        })
        .then(() => {
            console.log(`Branche ${branch} créée`);
            return getGithubFile(path, branch);
        })
        .then((res) => {
            const yaml = require("js-yaml");
            let content = Buffer.from(res.data.content, "base64").toString(
                "utf-8"
            );
            let splitDoc = content.split("---");
            const doc = yaml.load(splitDoc[1]);
            for (const key of Object.keys(changes)) {
                const value = changes[key];
                if (!value || (Array.isArray(value) && !value.length)) {
                    delete doc[key];
                } else {
                    doc[key] = changes[key];
                }
            }
            const schema = yaml.DEFAULT_SCHEMA;
            schema.compiledTypeMap.scalar[
                "tag:yaml.org,2002:timestamp"
            ].represent = function (object) {
                return object.toISOString().split("T")[0];
            };
            content =
                "---\n" +
                yaml.dump(doc, {
                    schema: schema,
                }) +
                "---";
            if (mainContent) {
                content = content + "\n" + mainContent;
            } else if (splitDoc[2]) {
                content = content + splitDoc[2];
            }
            return createGithubFile(path, branch, content, res.data.sha);
        })
        .then(() => {
            console.log(
                `Fiche Github pour ${name} mise à jour dans la branche ${branch}`
            );
            return makeGithubPullRequest(branch, `Mise à jour de ${name}`);
        })
        .then((response) => {
            console.log(`Pull request pour la fiche de ${name} ouverte`);
            if (response.status !== 201 && response.data.html_url) {
                throw new Error(
                    "Il y a eu une erreur merci de recommencer plus tard"
                );
            }
            return response.data;
        })
        .catch((err) => {
            console.log(err);
            throw new Error(
                `Erreur Github lors de la mise à jour de la fiche de ${name}`
            );
        });
}

export async function updateMultipleFilesPR(
    prName: string,
    files: GithubBetagouvFile[],
    branchName?: string
) {
    const branch = branchName || createBranchName(prName);
    const {
        data: {
            object: { sha },
        },
    } = await getGithubMasterSha();
    console.log("SHA du master obtenu");
    try {
        // dont cry if branch already exist
        await createGithubBranch(sha, branch)
            .then(() => {
                console.log(`Branche ${branch} créée pour ${prName}`);
            })
            .catch(() => false);
        const refBranch = await getGithubBranch(branch).catch(() => false);

        // use the branch
        if (refBranch) {
            // update files on given branch
            for (const file of files) {
                await updateFileOnBranch(
                    file,
                    branch,
                    refBranch.data.commit.sha // || refBranch.data.object.sha
                );
            }

            const pr = await getPullRequest({
                head: `${config.githubFork.split("/")[0]}:${branch}`,
            }).catch((e) => {
                console.log("pr doesnt exist", e);
                return false;
            });

            if (pr) {
                console.log("PR found", pr);
                return pr;
            } else {
                console.log("create PR", branch, prName);
                const response = await makeGithubPullRequest(
                    branch,
                    `${prName}`
                );

                if (response.status !== 201 && response.data.html_url) {
                    throw new Error(
                        "Il y a eu une erreur merci de recommencer plus tard"
                    );
                }
                return response.data;
            }
        }
        throw new Error(
            "Impossible de trouver la Pull request à mettre à jour"
        );
    } catch (err) {
        console.log(err);
        throw new Error(`Erreur Github lors de la pull request : ${prName}`);
    }
}

export async function updateAuthorGithubFile(
    username: string,
    changes: GithubAuthorChange | GithubAuthorMissionChange
): Promise<PRInfo> {
    const path = `content/_authors/${username}.md`;
    return updateGithubCollectionEntry(username, path, changes);
}

export async function updateStartupGithubFile(
    startupname: string,
    changes: GithubStartupChange,
    content: string
): Promise<PRInfo> {
    const path = `content/_startups/${startupname}.md`;
    return updateGithubCollectionEntry(startupname, path, changes, content);
}
