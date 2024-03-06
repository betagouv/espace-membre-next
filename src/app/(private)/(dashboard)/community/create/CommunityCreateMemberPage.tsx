"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { createMember as createMemberAction } from "@/app/actions/member";
import SESelect from "@/components/SESelect";
import { userStatusOptions } from "@/frontConfig";
import {
    DOMAINE_OPTIONS,
    Domaine,
    createMemberSchema,
    memberSchema,
} from "@/models/member";
import { Status, missionSchema } from "@/models/mission";
import { useSession } from "@/proxies/next-auth";
import routes, { computeRoute } from "@/routes/routes";

// data from secretariat API
export interface BaseInfoUpdateProps {
    startupOptions: {
        value: string;
        label: string;
    }[];
}

const Mission = ({ register, control, setValue, startupOptions, errors }) => {
    const missionErrors = errors;
    const defaultState = (field) => ({
        state:
            missionErrors && missionErrors[field]
                ? ("error" as const)
                : ("default" as const),
        stateRelatedMessage: missionErrors && missionErrors[field]?.message,
    });
    const startDateValue = useWatch({
        control,
        name: `mission.start`,
    });
    // Convertir la valeur de date en format de chaîne requis par l'input de type date
    const startDateString = startDateValue
        ? new Date(startDateValue).toISOString().substring(0, 10)
        : "";

    const endDateValue = useWatch({
        control,
        name: `mission.end`,
    });
    const endDateString = endDateValue
        ? new Date(endDateValue).toISOString().substring(0, 10)
        : "";
    return (
        <div className={fr.cx("fr-mb-6w")}>
            <div className={fr.cx("fr-text--heavy")}>
                <hr className={fr.cx("fr-mt-1w")} />
            </div>
            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                <div className={fr.cx("fr-col-3")}>
                    <Input
                        label="Date de début"
                        hintText="Début de ta mission"
                        nativeInputProps={{
                            style: { width: 200 },
                            placeholder: "JJ/MM/YYYY",
                            type: "date",
                            ...register(`mission.start`),
                            value: startDateString,
                        }}
                        {...defaultState("start")}
                    />
                </div>{" "}
                <div className={fr.cx("fr-col-4")}>
                    <Input
                        label="Date de fin"
                        nativeInputProps={{
                            style: { width: 200 },
                            placeholder: "JJ/MM/YYYY",
                            type: "date",
                            ...register(`mission.end`),
                            value: endDateString,
                        }}
                        hintText={
                            <div>
                                En cas de doute, mettre{" "}
                                <button
                                    className={fr.cx("fr-link", "fr-text--xs")}
                                    onClick={() => {}}
                                    role="button"
                                    type="button"
                                    title="Mettre la date de fin à +3 mois"
                                >
                                    J+3 mois
                                </button>
                            </div>
                        }
                        {...defaultState("end")}
                    />
                </div>
            </div>

            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                <div className={fr.cx("fr-col-6")}>
                    <Input
                        label="Employeur"
                        nativeInputProps={{
                            placeholder: "ex: Scopyleft",
                            ...register(`mission.employer`),
                        }}
                        {...defaultState("employer")}
                    />
                </div>
                <div className={fr.cx("fr-col-6")}>
                    <Select
                        label="Statut"
                        nativeSelectProps={{
                            ...register(`mission.status`),
                        }}
                        {...defaultState("status")}
                    >
                        <option value="">Statut:</option>
                        {userStatusOptions.map((option) => (
                            <option key={option.key} value={option.key}>
                                {option.name}
                            </option>
                        ))}
                    </Select>{" "}
                </div>
            </div>
            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                <div className={fr.cx("fr-col-12")}>
                    <SESelect
                        onChange={(startups) => {
                            setValue(
                                `mission.startups`,
                                startups.map((startup) => startup.value),
                                {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                }
                            );
                        }}
                        isMulti={true}
                        placeholder={`Sélectionne un ou plusieurs produits`}
                        startups={startupOptions}
                        label="Produits concernés par la mission :"
                        {...defaultState("startups")}
                    />
                </div>
            </div>
        </div>
    );
};

export type CreateMemberType = z.infer<typeof createMemberSchema>;

export default function CommunityCreateMemberPage(props: BaseInfoUpdateProps) {
    const defaultValues: CreateMemberType = {
        firstname: "",
        lastname: "",
        email: "",
        mission: {
            start: new Date(),
            status: Status.independent,
        },
        domaine: Domaine.ANIMATION,
    };
    const {
        register,
        handleSubmit,
        formState: { errors, isDirty, isSubmitting, isValid },
        setValue,
        control,
        watch,
    } = useForm<CreateMemberType>({
        resolver: zodResolver(createMemberSchema),
        mode: "onChange",
        defaultValues,
    });

    const [alertMessage, setAlertMessage] = React.useState<{
        title: string;
        message: NonNullable<React.ReactNode>;
        type: "success" | "warning";
    } | null>();
    const [isSaving, setIsSaving] = React.useState(false);
    const [prUrl, setPRURL] = React.useState<string>();

    const firstname = watch("firstname");
    const lastname = watch("lastname");
    const email = watch("email");

    const onSubmit = async (input: CreateMemberType) => {
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
            const { message, pr_url } = await createMemberAction(input);
            setAlertMessage({
                title: `Modifications enregistrées`,
                message,
                type: "success",
            });
            setPRURL(pr_url);
        } catch (e: any) {
            // todo: sentry
            console.log(e);
            setAlertMessage({
                title: "Erreur",
                //@ts-ignore
                message: e.response?.data?.message || e.message,
                type: "warning",
            });
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

    return (
        <>
            {!prUrl && (
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    aria-label="Modifier mes informations"
                >
                    <Input
                        label="Prénom"
                        nativeInputProps={{
                            placeholder: "ex: Grace",
                            ...register("firstname"),
                        }}
                        state={errors.firstname ? "error" : "default"}
                        stateRelatedMessage={errors.firstname?.message}
                    />
                    <Input
                        label="Nom"
                        nativeInputProps={{
                            placeholder: "ex: HOPPER",
                            ...register("lastname"),
                        }}
                        state={errors.lastname ? "error" : "default"}
                        stateRelatedMessage={errors.lastname?.message}
                    />
                    <Input
                        label="Email"
                        nativeInputProps={{
                            placeholder: "ex: grace.hopper@gmail.com",
                            ...register("email"),
                        }}
                        state={errors.email ? "error" : "default"}
                        stateRelatedMessage={errors.email?.message}
                    />
                    <h3>Mission</h3>
                    <Select
                        label="Domaine"
                        nativeSelectProps={{
                            ...register(`domaine`),
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
                    <Mission
                        control={control}
                        register={register}
                        setValue={setValue}
                        startupOptions={props.startupOptions}
                        errors={undefined}
                    ></Mission>
                    <Button
                        className={fr.cx("fr-mt-3w")}
                        children={
                            isSubmitting
                                ? `Création en cours...`
                                : `Créer la fiche`
                        }
                        nativeButtonProps={{
                            type: "submit",
                            disabled: !isDirty || isSubmitting,
                        }}
                    />
                </form>
            )}
            {!!prUrl && (
                <>
                    <h1>C'est presque bon !</h1>
                    <Alert
                        small={true}
                        severity="info"
                        description={`La fiche membre de ${firstname} ${lastname} doit être validée sur Github (tu peux le faire, ou demander à quelqu'un de la communauté).`}
                    ></Alert>
                    <Button
                        className={fr.cx("fr-my-2w")}
                        linkProps={{
                            target: "_blank",
                            href: prUrl,
                        }}
                        priority="secondary"
                    >
                        Voir la fiche github
                    </Button>
                    <h2>Et après ?</h2>
                    <p>
                        Une fois la fiche validée, {firstname} {lastname}{" "}
                        recevra des informations à l'adresse {email}.
                    </p>
                </>
            )}
        </>
    );
}
