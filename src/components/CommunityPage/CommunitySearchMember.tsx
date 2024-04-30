"use client";
import React from "react";

import Button from "@codegouvfr/react-dsfr/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";

import MemberSelect from "../MemberSelect";

import { Member } from "@/models/member";
import { routeTitles } from "@/utils/routes/routeTitles";

/* Pure component */
export const CommunitySearchMember = ({ users }: { users: Member[] }) => {
    const router = useRouter();
    const [username, setUsername] = React.useState<string | undefined>();

    const save = (event: { preventDefault: () => void }) => {
        event.preventDefault();
        router.push(`/community/${username}`);
    };

    return (
        <>
            <div>
                <h1>{routeTitles.community()}</h1>
                <form onSubmit={save}>
                    <div>
                        <MemberSelect
                            name="username"
                            placeholder="Sélectionner un membre"
                            onChange={(member) => {
                                setUsername(
                                    (member as { value: string }).value
                                );
                            }}
                            members={users.map((u) => ({
                                value: u.id,
                                label: u.fullname,
                            }))}
                            defaultValue={undefined}
                        ></MemberSelect>
                    </div>
                    <div className="fr-mt-6v">
                        <Button
                            nativeButtonProps={{
                                type: "submit",
                            }}
                        >
                            Voir la fiche
                        </Button>
                    </div>
                </form>
                <br />
                <p>
                    Le membre que vous cherchez n'existe pas ? Vous pouvez
                    l'inviter via le{" "}
                    <Link href="/community/create">
                        formulaire de création de fiche
                    </Link>
                    .
                </p>
            </div>
        </>
    );
};
