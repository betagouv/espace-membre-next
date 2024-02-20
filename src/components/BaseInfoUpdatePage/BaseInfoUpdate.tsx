"use client";
import React from "react";
import { z } from "zod";

import Input from "@codegouvfr/react-dsfr/Input";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { fr } from "@codegouvfr/react-dsfr";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { DBPullRequest } from "@/models/pullRequests";
import { routeTitles } from "@/utils/routes/routeTitles";

import { MissionsEditor } from "./MissionsEditor";
import { DOMAINE_OPTIONS, memberSchema } from "@/models/member";
import Select from "@codegouvfr/react-dsfr/Select";
import axios from "axios";
import routes, { computeRoute } from "@/routes/routes";
import { useSession } from "@/proxies/next-auth";
import { FormErrorResponse } from "@/models/misc";

import { PullRequestWarning } from "./PullRequestWarning";

export type MemberSchemaType = z.infer<typeof memberSchema>;

// data from secretariat API
export interface BaseInfoUpdateProps {
    formData: MemberSchemaType;
    startupOptions: {
        value: string;
        label: string;
    }[];
    updatePullRequest?: DBPullRequest;
}

const postMemberData = async ({ values, sessionUsername }) => {
    const {
        data: { pr_url, username },
    }: {
        data: { pr_url: string; username: string };
    } = await axios.post(
        computeRoute(routes.ACCOUNT_POST_BASE_INFO_FORM).replace(
            ":username",
            sessionUsername
        ),
        values,
        {
            withCredentials: true,
        }
    );
    return { pr_url, username };
};

export const BaseInfoUpdate = (props: BaseInfoUpdateProps) => {
    const defaultValues: MemberSchemaType = { ...props.formData };

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty, isSubmitting, isValid },
        setValue,
        control,
    } = useForm<MemberSchemaType>({
        resolver: zodResolver(memberSchema),
        mode: "onChange",
        defaultValues,
    });

    const session = useSession();

    const [alertMessage, setAlertMessage] = React.useState<{
        title: string;
        message: NonNullable<React.ReactNode>;
        type: "success" | "warning";
    } | null>();
    const [isSaving, setIsSaving] = React.useState(false);

    const onSubmit = async (input: MemberSchemaType) => {
        //console.log("onSubmit", input);

        if (isSaving) {
            return;
        }
        if (!isValid) {
            console.log("invalid");
            return;
        }
        setIsSaving(true);
        setAlertMessage(null);
        try {
            const { pr_url, username } = await postMemberData({
                values: input,
                sessionUsername: session.data?.user?.name as string,
            });
            setAlertMessage({
                title: `⚠️ Pull request pour la mise à jour de la fiche de ${username} ouverte.`,
                message: (
                    <>
                        Demande à un membre de ton équipe de merger ta fiche :{" "}
                        <a href={pr_url} target="_blank">
                            {pr_url}
                        </a>
                        .
                        <br />
                        Une fois mergée, ton profil sera mis à jour.
                    </>
                ),
                type: "success",
            });
        } catch (e) {
            // todo: sentry
            console.log(e);
            const ErrorResponse: FormErrorResponse = e as FormErrorResponse;
            setAlertMessage({
                title: "Erreur",
                message: <>{ErrorResponse.message}</>,
                type: "warning",
            });
            setIsSaving(false);
            if (ErrorResponse.errors) {
                control.setError("root", {
                    message: Object.values(ErrorResponse.errors).join("\n"),
                });
            }
        }
        document.body.scrollIntoView();
        setIsSaving(false);
    };

    // todo: récupérer les labels Zod

    return (
        <>
            <div>
                <h1>{routeTitles.accountEditBaseInfo()}</h1>
                <p>
                    Ces informations seront publiées sur le site beta.gouv.fr.
                </p>

                {!!props.updatePullRequest && (
                    <PullRequestWarning pullRequest={props.updatePullRequest} />
                )}

                {!!alertMessage && (
                    // todo: sentry
                    <Alert
                        className="fr-mb-8v"
                        severity={alertMessage.type}
                        closable={false}
                        title={alertMessage.title}
                        description={alertMessage.message}
                    />
                )}
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    aria-label="Modifier mes informations"
                >
                    <Input
                        label="Nom complet"
                        nativeInputProps={{
                            placeholder: "ex: Grace HOPPER",
                            ...register("fullname"),
                        }}
                        state={errors.fullname ? "error" : "default"}
                        stateRelatedMessage={errors.fullname?.message}
                    />
                    <Input
                        label="Rôle chez beta.gouv.fr"
                        nativeInputProps={{
                            placeholder: "ex: Développeuse",
                            ...register("role"),
                        }}
                        state={errors.role ? "error" : "default"}
                        stateRelatedMessage={errors.role?.message}
                    />
                    <Select
                        label="Domaine"
                        nativeSelectProps={{
                            ...register(`domaine`),
                            defaultValue: props.formData.domaine,
                        }}
                        state={errors.domaine ? "error" : "default"}
                        stateRelatedMessage={errors.domaine?.message}
                    >
                        <option value="">Domaine:</option>
                        {DOMAINE_OPTIONS.map((domaine) => (
                            <option key={domaine.key} value={domaine.name}>
                                {domaine.name}
                            </option>
                        ))}
                    </Select>
                    <Input
                        textArea
                        label="Courte bio"
                        nativeTextAreaProps={{ ...register("bio") }}
                        state={errors.bio ? "error" : "default"}
                        stateRelatedMessage={errors.bio?.message}
                    />
                    <Input
                        label="Adresse du profil LinkedIn ou site web"
                        nativeInputProps={{
                            placeholder: "ex: https://linkedin.com/in/xxxx",
                            ...register("link"),
                        }}
                        state={errors.link ? "error" : "default"}
                        stateRelatedMessage={errors.link?.message}
                    />
                    <h3>Mes missions</h3>
                    <p>
                        Précise les dates et employeurs de tes missions, et les
                        produits concernés.
                    </p>
                    <MissionsEditor
                        control={control}
                        setValue={setValue}
                        register={register}
                        startupOptions={props.startupOptions}
                        errors={errors.missions || []}
                    />
                    <Button
                        className={fr.cx("fr-mt-3w")}
                        children={
                            isSubmitting
                                ? `Enregistrement en cours...`
                                : `Enregistrer`
                        }
                        nativeButtonProps={{
                            type: "submit",
                            disabled: !isDirty || isSubmitting,
                        }}
                    />
                </form>
            </div>
        </>
    );
};
