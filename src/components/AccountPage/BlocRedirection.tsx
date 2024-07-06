"use client";
import React from "react";

import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import Button from "@codegouvfr/react-dsfr/Button";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Input } from "@codegouvfr/react-dsfr/Input";
import axios from "axios";

import {
    memberBaseInfoSchemaType,
    memberWrapperSchemaType,
} from "@/models/member";
import routes, { computeRoute } from "@/routes/routes";

export default function BlocRedirection({
    redirections,
    canCreateRedirection,
    userInfos,
    isExpired,
    domain,
}: {
    userInfos: memberBaseInfoSchemaType;
    canCreateRedirection: boolean;
    isExpired: boolean;
    redirections: memberWrapperSchemaType["emailRedirections"];
    domain: string;
}) {
    const [toEmail, setToEmail] = React.useState<string>("");
    const [keepCopy, setKeepCopy] = React.useState<boolean>(false);
    const [isSaving, setIsSaving] = React.useState<boolean>(false);
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
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    try {
                                        await axios.delete(
                                            computeRoute(
                                                routes.USER_DELETE_REDIRECTION_API
                                            )
                                                .replace(
                                                    ":username",
                                                    userInfos.username
                                                )
                                                .replace(
                                                    ":email",
                                                    redirection.to
                                                ),
                                            { withCredentials: true }
                                        );
                                    } catch (e) {}
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
                    onSubmit={async (e) => {
                        e.preventDefault();
                        setIsSaving(true);
                        try {
                            await axios.post(
                                computeRoute(
                                    routes.USER_CREATE_REDIRECTION_API
                                ).replace(":username", userInfos.username),
                                {
                                    to_email: toEmail,
                                    keepCopy,
                                },
                                {
                                    withCredentials: true,
                                }
                            );
                        } catch (e) {
                            console.error(e);
                        }
                        setIsSaving(false);
                    }}
                >
                    <Input
                        label={`Rediriger mes mails vers :`}
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
                            disabled: isSaving,
                        }}
                        children={
                            isSaving
                                ? `Ajout en cours...`
                                : `Ajouter la redirection`
                        }
                    />
                </form>
            )}
            {canCreateRedirection && (
                <>
                    {isExpired && (
                        <div className="notification error">
                            Le compte de {userInfos.fullname} est expiré.
                        </div>
                    )}
                    {!isExpired && (
                        <div className="notification warning">
                            Seul {userInfos.fullname} peut créer ou modifier les
                            redirections.
                        </div>
                    )}
                </>
            )}
        </Accordion>
    );
}
