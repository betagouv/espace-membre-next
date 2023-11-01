"use client";
import React from "react";
import routes, { computeRoute } from "@/routes/routes";
import axios from "axios";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import Button from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";

export default function BlocRedirection({
    redirections,
    canCreateRedirection,
    userInfos,
    isExpired,
    domain,
}) {
    const [toEmail, setToEmail] = React.useState<string>("");
    const [keepCopy, setKeepCopy] = React.useState<boolean>(false);
    return (
        <Accordion label="Rediriger vers une autre adresse mail">
            <p>
                🚨 Il n'est pas recommandé d'utiliser les redirections :{" "}
                <b>certains de tes messages seront perdus</b>. Mais une
                redirection peut être utile en complément d'une récupération{" "}
                <i>POP</i> ou d'une application type Frontapp.
            </p>
            {(redirections || []).map((redirection, i: number) => {
                return (
                    <div className="redirection-item" key={i}>
                        {redirection.to}
                        {canCreateRedirection && (
                            <form
                                className="redirection-form"
                                method="POST"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    axios.delete(
                                        routes.USER_DELETE_REDIRECTION.replace(
                                            ":username",
                                            userInfos.id
                                        ).replace(":email", redirection.to)
                                    );
                                }}
                            >
                                <Button
                                    priority="secondary"
                                    nativeButtonProps={{
                                        type: "submit",
                                    }}
                                >
                                    Supprimer
                                </Button>
                            </form>
                        )}
                    </div>
                );
            })}
            {canCreateRedirection && (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        axios.post(
                            computeRoute(
                                routes.USER_CREATE_REDIRECTION
                            ).replace(":username", userInfos.id),
                            {
                                toEmail,
                                keepCopy,
                            }
                        );
                    }}
                >
                    <Input
                        label={`Rediriger mes mails ${domain} vers :`}
                        nativeInputProps={{
                            type: "email",
                            required: true,
                            onChange: (e) => {
                                setToEmail(e.target.value);
                            },
                        }}
                    />
                    <Checkbox
                        options={[
                            {
                                label: "Garder une copie des emails si un compte existe",
                                nativeInputProps: {
                                    name: "checkboxes-1",
                                    value: "true",
                                    onChange: (e) => {
                                        setKeepCopy(e.target.value === "true");
                                    },
                                },
                            },
                        ]}
                        state="default"
                    />
                    <Button
                        priority="primary"
                        nativeButtonProps={{
                            type: "submit",
                        }}
                    >
                        Ajouter la redirection
                    </Button>
                </form>
            )}
            {canCreateRedirection && (
                <>
                    {isExpired && (
                        <div className="notification error">
                            Le compte {userInfos.id} est expiré.
                        </div>
                    )}
                    {!isExpired && (
                        <div className="notification warning">
                            Seul {userInfos.id} peut créer ou modifier les
                            redirections.
                        </div>
                    )}
                </>
            )}
        </Accordion>
    );
}
