"use client";
import { Member } from "@/models/member";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Button from "@codegouvfr/react-dsfr/Button";
import { Table } from "@codegouvfr/react-dsfr/Table";

function MemberTable({ members }: { members: Member[] }) {
    return (
        <Table
            data={members.map((member: Member) => [
                <a
                    className="fr-link"
                    target="_blank"
                    href={`https://github.com/betagouv/beta.gouv.fr/edit/master/content/_authors/${member.id}.md`}
                >
                    {member.fullname}
                </a>,
                member.role,
                member.end,
            ])}
            headers={["Nom", "Role", "Date de fin"]}
        />
    );
}

export default async function StartupPage({
    startupInfos,
    currentPhase,
    updatePullRequest,
    members,
}) {
    return (
        <>
            <p className="fr-text--sm fr-mb-2v">
                <a href="/startups">Produit</a> &gt;{" "}
                <a href="">{startupInfos.id}</a>
            </p>
            <div className="fr-mb-8v">
                <h3>Startup</h3>
                <p>
                    <span>
                        Nom :
                        <a
                            href={`https://github.com/betagouv/beta.gouv.fr/edit/master/content/_startups/${startupInfos.id}.md`}
                        >
                            {startupInfos.name}
                        </a>
                    </span>
                    <br />
                    <span>Repository :{startupInfos.repository}</span>
                    <br />
                    <span>Contact : {startupInfos.contact}</span>
                    <br />
                    <span>Phase : currentPhase</span>
                    <br />
                </p>
                <p className="fr-text--sm" style={{ fontStyle: "italic" }}>
                    Une informations n'est à jour ?
                </p>
                {updatePullRequest && (
                    <>
                        <br />
                        <div className="notification">
                            ⚠️ Une pull request existe déjà sur cette fiche.
                            Quelqu'un doit la merger pour les changements soit
                            pris en compte
                            <a
                                className="fr-link"
                                href="<%= updatePullRequest.url %>"
                                target="_blank"
                            >
                                {updatePullRequest.url}
                            </a>
                            <br />
                            (la prise en compte peut prendre 10 minutes.)
                        </div>
                    </>
                )}
                <Button
                    linkProps={{
                        href: `/startups/${startupInfos.id}/info-form`,
                    }}
                >
                    ✏️ Mettre à jour les infos
                </Button>
            </div>

            <div className="fr-mb-4v">
                <h3>Membres</h3>
                <Accordion label="Membres actuels" expanded={true}>
                    <MemberTable members={members.active_members} />
                </Accordion>
                <Accordion label="Membres expirés">
                    <MemberTable members={members.expired_members} />
                </Accordion>
                <Accordion label="Membres précédents">
                    <MemberTable members={members.previous_members} />
                </Accordion>
            </div>
        </>
    );
}
