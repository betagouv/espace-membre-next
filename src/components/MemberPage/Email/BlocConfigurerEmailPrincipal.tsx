import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import axios from "axios";

import { managePrimaryEmailForUser } from "@/app/api/member/actions";
import { memberBaseInfoSchemaType } from "@/models/member";
import routes, { computeRoute } from "@/routes/routes";

export default function BlocConfigurerEmailPrincipal({
    canChangeEmails,
    userInfos,
}: {
    canChangeEmails: boolean;
    userInfos: memberBaseInfoSchemaType;
}) {
    const [value, setValue] = React.useState<string>(
        userInfos.primary_email || ""
    );
    const [isSaving, setIsSaving] = React.useState<boolean>(false);
    return (
        <Accordion label="Configurer mon email principal">
            <p>
                L'email principal est utilisé pour toutes les communications en
                rapport avec Betagouv. Ce doit être un email d'agent public. Il
                s'agit par défaut de {userInfos.username}@beta.gouv.fr.
                <br />
                <br />
                <i
                    className={fr.cx("fr-icon--md", "fr-icon-warning-fill")}
                />{" "}
                En cas d'utilisation d'une adresse autre,{" "}
                <strong>
                    l'email {userInfos.username}
                    @beta.gouv.fr sera définitivement supprimé
                </strong>
                .
            </p>
            {canChangeEmails && (
                <form
                    method="POST"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        const confirmed = confirm(
                            "Êtes-vous vraiment certain(e) de vouloir changer cet email ?"
                        );
                        if (confirmed) {
                            setIsSaving(true);
                            const resp = await managePrimaryEmailForUser({
                                username: userInfos.username,
                                primaryEmail: value,
                            });
                            setIsSaving(false);
                        }
                    }}
                >
                    <Input
                        label="Email"
                        nativeInputProps={{
                            type: "email",
                            value,
                            onChange: (e) => {
                                setValue(e.target.value);
                            },
                        }}
                    />
                    <Button
                        nativeButtonProps={{
                            type: "submit",
                            disabled: isSaving,
                        }}
                        children={
                            isSaving
                                ? `Sauvegarde en cours...`
                                : `Sauvegarder l'email principal`
                        }
                    />
                </form>
            )}
        </Accordion>
    );
}
