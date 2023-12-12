"use client";
import { Member } from "@/models/member";
import { Phase } from "@/models/startup";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { Table } from "@codegouvfr/react-dsfr/Table";

function MemberTable({ members }: { members: Member[] }) {
    return (
        <Table
            data={members.map((member: Member, index: number) => [
                <a
                    key={index}
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

export interface StartupPageProps {
    startupInfos: any;
    currentPhase: string;
    updatePullRequest: any;
    members: {
        expired_members: Member[];
        active_members: Member[];
        previous_members: Member[];
    };
}

export default function StartupPage({
    startupInfos,
    currentPhase,
    updatePullRequest,
    members,
}: StartupPageProps) {
    return (
        <>
            <div className="fr-mb-8v">
                <h1>{startupInfos.name}</h1>
                <p>
                    <span>
                        Fiche github :{" "}
                        <a
                            className="fr-link"
                            target="_blank"
                            href={`https://github.com/betagouv/beta.gouv.fr/edit/master/content/_startups/${startupInfos.id}.md`}
                        >
                            {startupInfos.name}
                        </a>
                    </span>
                    <br />
                    <span>
                        Repository :{" "}
                        <a
                            className="fr-link"
                            target="_blank"
                            href={startupInfos.repository}
                        >
                            {startupInfos.repository}
                        </a>
                    </span>
                    <br />
                    <span>Contact : {startupInfos.contact}</span>
                    <br />
                    <span>Phase : {currentPhase}</span>
                    <br />
                </p>
                <p className="fr-text--sm" style={{ fontStyle: "italic" }}>
                    Une informations n'est à jour ?
                </p>
                {updatePullRequest && (
                    <>
                        <br />
                        <Alert
                            severity="warning"
                            small={true}
                            closable={false}
                            title="Une pull request existe déjà sur cette fiche."
                            description={
                                <>
                                    {`Toi ou un membre de ton équipe doit la
                                    merger pour que les changements soient pris en
                                    compte : `}
                                    <a
                                        href={updatePullRequest.url}
                                        target="_blank"
                                    >
                                        {updatePullRequest.url}
                                    </a>
                                    <br />
                                    (la prise en compte peut prendre 10
                                    minutes.)
                                </>
                            }
                        />
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
                <Accordion
                    label="Membres actuels"
                    expanded={true}
                    onExpandedChange={(expanded, e) => {}}
                >
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
