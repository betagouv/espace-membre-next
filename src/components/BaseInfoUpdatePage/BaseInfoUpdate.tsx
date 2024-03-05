"use client";
import React from "react";
import { z } from "zod";

import Input from "@codegouvfr/react-dsfr/Input";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { fr } from "@codegouvfr/react-dsfr";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { routeTitles } from "@/utils/routes/routeTitles";

import { MissionsEditor } from "./MissionsEditor";
import { DOMAINE_OPTIONS, memberSchema } from "@/models/member";
import Select from "@codegouvfr/react-dsfr/Select";
import axios from "axios";
import routes, { computeRoute } from "@/routes/routes";
import { useSession } from "@/proxies/next-auth";

import { PullRequestWarning } from "../PullRequestWarning";

export type MemberSchemaType = z.infer<typeof memberSchema>;

// data from secretariat API
export interface BaseInfoUpdateProps {
    formData: MemberSchemaType;
    startupOptions: {
        value: string;
        label: string;
    }[];
    updatePullRequest?: { url: string };
}

const postMemberData = async ({ values, sessionUsername }) => {
    const {
        data: { username, message },
    }: {
        data: { username: string; message: string };
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
    return { username, message };
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
            const { message } = await postMemberData({
                values: input,
                sessionUsername: session.data?.user?.name as string,
            });
            setAlertMessage({
                title: `Modifications enregistrées`,
                message,
                type: "success",
            });
        } catch (e: any) {
            // todo: sentry
            console.log(e);
            setAlertMessage({
                title: "Erreur",
                //@ts-ignore
                message: e.response?.data?.message || e.message,
                type: "warning",
            });
            //e.response.data.fieldErrors;
            setIsSaving(false);
            if (e.errors) {
                control.setError("root", {
                    //@ts-ignore
                    message: Object.values(e.errors).join("\n"),
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

                {!!alertMessage && (
                    // todo: sentry
                    <Alert
                        className="fr-mb-8v"
                        severity={alertMessage.type}
                        closable={false}
                        title={alertMessage.title}
                        description={
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: alertMessage.message,
                                }}
                            />
                        }
                    />
                )}

                {!!props.updatePullRequest && (
                    <PullRequestWarning url={props.updatePullRequest.url} />
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
