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
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";

import { CompetencesEditor } from "./CompetencesEditor";
import { MissionsEditor } from "./MissionsEditor";
import CitySelect from "../CitySelect";
import GenderSelect from "../GenderSelect";
import LastChange from "../LastChange";
import UploadForm from "../UploadForm/UploadForm";
import { imagePostApiSchemaType } from "@/models/actions/image";
import {
    memberInfoUpdateSchemaType,
    memberInfoUpdateSchema,
} from "@/models/actions/member";
import { statusOptions } from "@/models/member";
import { DOMAINE_OPTIONS, memberSchema } from "@/models/member";
import { PrivateMemberChangeSchemaType } from "@/models/memberChange";
import { Option } from "@/models/misc";
import routes, { computeRoute } from "@/routes/routes";
import { routeTitles } from "@/utils/routes/routeTitles";
// data from secretariat API
export interface BaseInfoUpdateProps {
    profileURL?: string;
    changes: PrivateMemberChangeSchemaType[];
    formData: memberInfoUpdateSchemaType;
    startupOptions: Option[];
    username: string;
}

const postMemberData = async ({
    values,
    username,
}: {
    values: memberInfoUpdateSchemaType;
    username: string;
}) => {
    const { member, picture, shouldDeletePicture } = values;
    if (picture) {
        const imageBody: imagePostApiSchemaType = {
            fileIdentifier: "avatar",
            fileRelativeObjType: "member",
            fileObjIdentifier: username,
            fileType: "image/jpeg",
            revalidateMemberImage: true,
        };
        const response = await fetch("/api/image", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(imageBody),
        });
        const { signedUrl } = await response.json();

        const uploadResponse = await fetch(signedUrl, {
            method: "PUT",
            headers: {
                "Content-Type": picture.type,
            },
            body: picture as File,
        });

        if (uploadResponse.ok) {
            console.log(signedUrl.split("?")[0]);
            console.log("File uploaded successfully");
        } else {
            console.error("Failed to upload file");
        }
    }
    if (shouldDeletePicture) {
        await fetch("/api/image", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                fileRelativeObjType: "member",
                fileObjIdentifier: username,
                fileIdentifier: "avatar",
                revalidateMemberImage: true,
            }),
        });
    }
    const {
        data: { message },
    }: {
        data: { username: string; message: string };
    } = await axios.put(
        computeRoute(routes.ACCOUNT_POST_BASE_INFO_FORM).replace(
            ":username",
            username
        ),
        member,
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
        trigger,
        control,
        getValues,
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
                username: props.username,
            });
            setAlertMessage({
                title: `Modifications enregistrées. Elle seront visibles en ligne d'ici 24 heures.`,
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
            setValue(`member.osm_city`, JSON.stringify(newValue), {
                shouldValidate: true,
                shouldDirty: true,
            });
            setValue(`member.workplace_insee_code`, "", {
                shouldValidate: true,
                shouldDirty: true,
            });
        } else {
            setValue(`member.workplace_insee_code`, newValue.value, {
                shouldValidate: true,
                shouldDirty: true,
            });
            setValue(`member.osm_city`, "", {
                shouldValidate: true,
                shouldDirty: true,
            });
        }
    };

    const isCurrentUser = session.data?.user.id === props.username;

    return (
        <>
            <div className={fr.cx("fr-mb-5w")}>
                <h1>
                    {isCurrentUser
                        ? routeTitles.accountEditBaseInfo()
                        : `Mise à jour des informations de ${props.formData.member.fullname}`}
                </h1>
                <p>
                    Ces informations seront publiées sur le site beta.gouv.fr.
                </p>
                <LastChange changes={props.changes} />
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
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    aria-label={
                        isCurrentUser
                            ? `Modifier mes informations`
                            : `Modifier les informations de ${props.formData.member.fullname}`
                    }
                >
                    <Input
                        label={
                            memberSchema.shape.fullname.description +
                            " (obligatoire)"
                        }
                        nativeInputProps={{
                            placeholder: "ex: Grace HOPPER",
                            ...register("member.fullname"),
                        }}
                        state={errors.member?.fullname ? "error" : "default"}
                        stateRelatedMessage={errors.member?.fullname?.message}
                    />
                    <Input
                        label={
                            memberSchema.shape.role.description +
                            " (obligatoire)"
                        }
                        nativeInputProps={{
                            placeholder: "ex: Développeuse",
                            ...register("member.role"),
                        }}
                        state={errors.member?.role ? "error" : "default"}
                        stateRelatedMessage={errors.member?.role?.message}
                    />
                    <Select
                        label="Domaine (obligatoire)"
                        nativeSelectProps={{
                            ...register(`member.domaine`),
                            defaultValue: props.formData.member.domaine,
                        }}
                        state={errors.member?.domaine ? "error" : "default"}
                        stateRelatedMessage={errors.member?.domaine?.message}
                    >
                        <option disabled value="" hidden>
                            Sélectionner une option
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
                        nativeTextAreaProps={{ ...register("member.bio") }}
                        state={errors.member?.bio ? "error" : "default"}
                        stateRelatedMessage={errors.member?.bio?.message}
                    />
                    <Input
                        label={memberSchema.shape.link.description}
                        nativeInputProps={{
                            placeholder: "ex: https://linkedin.com/in/xxxx",
                            ...register("member.link"),
                        }}
                        state={errors.member?.link ? "error" : "default"}
                        stateRelatedMessage={errors.member?.link?.message}
                    />
                    <Input
                        label={memberSchema.shape.github.description}
                        nativeInputProps={{
                            placeholder: "ex: kevinmitnick",
                            ...register("member.github"),
                        }}
                        state={errors.member?.github ? "error" : "default"}
                        stateRelatedMessage={errors.member?.github?.message}
                    />
                    <UploadForm
                        onChange={(event) => {
                            const file = event.target.files;
                            if (file && file.length) {
                                setValue("picture", file[0], {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                });
                                setValue("shouldDeletePicture", false);
                            }
                        }}
                        shape="round"
                        label="Photo de profil"
                        url={props.profileURL}
                        onDelete={() => {
                            setValue("picture", null, {
                                shouldValidate: true,
                                shouldDirty: true,
                            });
                            if (props.profileURL) {
                                setValue("shouldDeletePicture", true);
                            }
                        }}
                    />
                    <br />
                    <br />
                    <h2>
                        {" "}
                        {isCurrentUser ? `Mes compétences` : `Compétences`}
                    </h2>
                    {isCurrentUser && (
                        <p>
                            Aide les membres de la communauté à mieux
                            t'identifier en cas de besoin
                        </p>
                    )}
                    <CompetencesEditor
                        onChange={(e, values) => {
                            setValue("member.competences", values, {
                                shouldDirty: true,
                            });
                        }}
                        defaultValue={props.formData.member.competences || []}
                    />
                    <br />
                    <br />
                    <h2>{isCurrentUser ? `Mes missions` : `Missions`}</h2>
                    {!!isCurrentUser && (
                        <p>Renseigne tes différentes missions chez beta.</p>
                    )}
                    <MissionsEditor
                        control={control}
                        setValue={setValue}
                        trigger={trigger}
                        register={register}
                        missionArrayKey="member.missions"
                        startupOptions={props.startupOptions}
                        errors={errors.member?.missions || []}
                    />
                    <h2>
                        {isCurrentUser
                            ? `Participe à notre observatoire statistique`
                            : `Observatoire statistique`}
                    </h2>
                    <p>
                        ⚠️ Ces valeurs servent à alimenter l'
                        <Link
                            href="/metabase"
                            target="_blank"
                            title="observatoire de la communauté - ouvre une nouvelle fenêtre"
                        >
                            observatoire de la communauté
                        </Link>
                        . Elles sont confidentielles et anonymisées mis à part
                        le lieu de travail.
                    </p>
                    <GenderSelect
                        label="Genre"
                        nativeSelectProps={{
                            ...register("member.gender"),
                        }}
                        state={errors.member?.gender ? "error" : "default"}
                        stateRelatedMessage={errors.member?.gender?.message}
                    />
                    <Select
                        label="Statut (obligatoire)"
                        nativeSelectProps={{
                            ...register(`member.legal_status`),
                        }}
                        state={
                            errors.member?.legal_status ? "error" : "default"
                        }
                        stateRelatedMessage={
                            errors.member?.legal_status?.message
                        }
                    >
                        <option value="" disabled hidden>
                            Sélectionner une option
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
                            ...register("member.tjm", {
                                setValueAs: (
                                    // use this instead of valueAsNumber to handle undefined value
                                    v
                                ) => (!v ? null : parseInt(v)),
                            }),
                            type: "number",
                        }}
                        state={errors.member?.tjm ? "error" : "default"}
                        stateRelatedMessage={errors.member?.tjm?.message}
                    />
                    <Input
                        label="Nombre de jours moyen travaillés par semaine"
                        hintText="Cette information est utilisée uniquement pour
                                    faire des statistiques. Elle n'est pas affichée."
                        nativeInputProps={{
                            ...register("member.average_nb_of_days", {
                                setValueAs: (
                                    // use this instead of valueAsNumber to handle undefined value
                                    v
                                ) => (!v ? null : parseInt(v)),
                            }),
                            type: "number",
                        }}
                        state={
                            errors.member?.average_nb_of_days
                                ? "error"
                                : "default"
                        }
                        stateRelatedMessage={
                            errors.member?.average_nb_of_days?.message
                        }
                    />
                    <h2>
                        {isCurrentUser
                            ? `Participe à la carte des membres (non anonyme)`
                            : "Carte des membres"}
                    </h2>
                    <CitySelect
                        onChange={handleCitySelect}
                        placeholder={"Commune ou code postal"}
                        state={
                            errors.member?.workplace_insee_code
                                ? "error"
                                : "default"
                        }
                        stateRelatedMessage={
                            errors.member?.workplace_insee_code?.message
                        }
                        defaultValue={
                            defaultValues.member.workplace_insee_code || ""
                        }
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
