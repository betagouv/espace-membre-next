"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Sentry from "@sentry/nextjs";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";

import { CompetencesEditor } from "./CompetencesEditor";
import { MissionsEditor } from "./MissionsEditor";
import CitySelect from "../CitySelect";
import GenderSelect from "../GenderSelect";
import { PullRequestWarning } from "../PullRequestWarning";
import { GithubAPIPullRequest } from "@/lib/github";
import {
    memberInfoUpdateSchemaType,
    memberInfoUpdateSchema,
} from "@/models/actions/member";
import { GenderCode, statusOptions } from "@/models/member";
import { DOMAINE_OPTIONS, memberSchema } from "@/models/member";
import routes, { computeRoute } from "@/routes/routes";
import { routeTitles } from "@/utils/routes/routeTitles";

// data from secretariat API
export interface BaseInfoUpdateProps {
    formData: memberInfoUpdateSchemaType;
    startupOptions: {
        value: string;
        label: string;
    }[];
    updatePullRequest?: GithubAPIPullRequest;
}

const postMemberData = async ({ values, sessionUsername }) => {
    const {
        data: { username, message },
    }: {
        data: { username: string; message: string };
    } = await axios.put(
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
    const defaultValues: memberInfoUpdateSchemaType = { ...props.formData };
    const {
        register,
        handleSubmit,
        formState: { errors, isDirty, isSubmitting, isValid },
        setValue,
        control,
    } = useForm<memberInfoUpdateSchemaType>({
        resolver: zodResolver(memberInfoUpdateSchema),
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

    const onSubmit = async (input: memberInfoUpdateSchemaType) => {
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
                sessionUsername: session.data?.user.id,
            });
            setAlertMessage({
                title: `Modifications enregistrées`,
                message,
                type: "success",
            });
        } catch (e: any) {
            console.log(e);
            setAlertMessage({
                title: "Erreur",
                //@ts-ignore
                message: e.response?.data?.message || e.message,
                type: "warning",
            });
            //e.response.data.fieldErrors;
            setIsSaving(false);
            Sentry.captureException(e);
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

    const handleCitySelect = (newValue) => {
        if (newValue.isOSM) {
            setValue(`osm_city`, JSON.stringify(newValue), {
                shouldValidate: true,
                shouldDirty: true,
            });
            setValue(`workplace_insee_code`, "", {
                shouldValidate: true,
                shouldDirty: true,
            });
        } else {
            setValue(`workplace_insee_code`, newValue.value, {
                shouldValidate: true,
                shouldDirty: true,
            });
            setValue(`osm_city`, "", {
                shouldValidate: true,
                shouldDirty: true,
            });
        }
    };

    return (
        <>
            <div className={fr.cx("fr-mb-5w")}>
                <h1>{routeTitles.accountEditBaseInfo()}</h1>
                <p>
                    Ces informations seront publiées sur le site beta.gouv.fr.
                </p>

                {!!alertMessage && (
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
                    <PullRequestWarning
                        url={props.updatePullRequest.html_url}
                    />
                )}

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    aria-label="Modifier mes informations"
                >
                    <Input
                        label={memberSchema.shape.fullname.description}
                        nativeInputProps={{
                            placeholder: "ex: Grace HOPPER",
                            ...register("fullname"),
                        }}
                        state={errors.fullname ? "error" : "default"}
                        stateRelatedMessage={errors.fullname?.message}
                    />
                    <Input
                        label={memberSchema.shape.role.description}
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
                        <option value="" disabled hidden>
                            Selectionnez une option
                        </option>
                        {DOMAINE_OPTIONS.map((domaine) => (
                            <option key={domaine.key} value={domaine.name}>
                                {domaine.name}
                            </option>
                        ))}
                    </Select>
                    <Input
                        textArea
                        label={memberSchema.shape.bio.description}
                        nativeTextAreaProps={{ ...register("bio") }}
                        state={errors.bio ? "error" : "default"}
                        stateRelatedMessage={errors.bio?.message}
                    />
                    <Input
                        label={memberSchema.shape.link.description}
                        nativeInputProps={{
                            placeholder: "ex: https://linkedin.com/in/xxxx",
                            ...register("link"),
                        }}
                        state={errors.link ? "error" : "default"}
                        stateRelatedMessage={errors.link?.message}
                    />
                    <Input
                        label={memberSchema.shape.github.description}
                        nativeInputProps={{
                            placeholder: "ex: kevinmitnick",
                            ...register("github"),
                        }}
                        state={errors.github ? "error" : "default"}
                        stateRelatedMessage={errors.github?.message}
                    />
                    <h3>Mes compétences</h3>
                    <p>
                        Tu peux préciser tes compétences, cela permettra à la
                        communauté de mieux de trouver en cas de besoin {`:)`}
                    </p>
                    <CompetencesEditor
                        onChange={(e, values) => {
                            setValue("competences", values, {
                                shouldDirty: true,
                            });
                        }}
                        defaultValue={props.formData.competences || []}
                    />
                    <br />
                    <br />
                    <h3>Mes missions</h3>
                    <p>
                        Précise les dates, employeurs et produits pour lesquels
                        tu as mis tes talents à contribution.
                        <br />
                        <br />
                        Ne saute aucun détail pour que la communauté puisse te
                        repérer facilement dans la foule !
                        <br />
                    </p>
                    <MissionsEditor
                        control={control}
                        setValue={setValue}
                        register={register}
                        startupOptions={props.startupOptions}
                        errors={errors.missions || []}
                    />
                    <h4>Participez à notre observatoire statistique </h4>
                    ⚠️ Ces valeurs servent à alimenter l'
                    <a
                        href="https://metabase.incubateur.net/public/dashboard/554ff353-6104-4c25-a261-d8bdc40f75d5"
                        target="_blank"
                    >
                        observatoire de la communauté
                    </a>
                    . Elles sont confidentielles et anonymisées mis à part le
                    lieu de travail.<br></br>
                    <GenderSelect
                        label="Genre"
                        nativeSelectProps={{
                            ...register("gender"),
                        }}
                        state={errors.gender ? "error" : "default"}
                        stateRelatedMessage={errors.gender?.message}
                    />
                    <Select
                        label="Statut"
                        nativeSelectProps={{
                            ...register(`legal_status`),
                        }}
                        state={errors.legal_status ? "error" : "default"}
                        stateRelatedMessage={errors.legal_status?.message}
                    >
                        <option value="" disabled hidden>
                            Selectionnez une option
                        </option>
                        {statusOptions.map((option) => (
                            <option key={option.key} value={option.key}>
                                {option.name}
                            </option>
                        ))}
                    </Select>
                    <Input
                        label="TJM moyen HT (si tu es indépendant)"
                        hintText="Cette information est utilisée uniquement pour
                                    faire des statistiques. Elle n'est pas affichée."
                        nativeInputProps={{
                            ...register("tjm", {
                                setValueAs: (
                                    // use this instead of valueAsNumber to handle undefined value
                                    v
                                ) => (!v ? null : parseInt(v)),
                            }),
                            type: "number",
                        }}
                        state={errors.tjm ? "error" : "default"}
                        stateRelatedMessage={errors.tjm?.message}
                    />
                    <h4>Participe à la carte des membres (non anonyme)</h4>
                    <CitySelect
                        onChange={handleCitySelect}
                        placeholder={"Commune ou code postal"}
                        state={
                            errors.workplace_insee_code ? "error" : "default"
                        }
                        stateRelatedMessage={
                            errors.workplace_insee_code?.message
                        }
                        defaultValue={""}
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
