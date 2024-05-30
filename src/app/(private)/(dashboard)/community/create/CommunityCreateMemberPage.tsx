"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Sentry from "@sentry/nextjs";
import { add } from "date-fns";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { Mission } from "@/components/BaseInfoUpdatePage/MissionsEditor";
import {
    createMemberSchema,
    createMemberSchemaType,
} from "@/models/actions/member";
import { DOMAINE_OPTIONS, Domaine } from "@/models/member";
import { Status } from "@/models/mission";
import routes, { computeRoute } from "@/routes/routes";

// data from secretariat API
export interface BaseInfoUpdateProps {
    startupOptions: {
        value: string;
        label: string;
    }[];
}

const postMemberData = async ({ values }) => {
    try {
        const response = await fetch(
            computeRoute(routes.ACCOUNT_POST_INFO_API),
            {
                method: "POST", // Specify the method
                body: JSON.stringify(values), // Convert the values object to JSON
                headers: {
                    "Content-Type": "application/json", // Specify the content type
                },
            }
        );

        if (!response.ok) {
            throw new Error("Network response was not ok");
        }

        const { message, pr_url } = await response.json(); // Destructure the data from the response

        return { message, pr_url }; // Return the username and message
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
        throw error; // Rethrow the error to be handled by the caller
    }
};

export default function CommunityCreateMemberPage(props: BaseInfoUpdateProps) {
    const defaultValues: createMemberSchemaType = {
        member: {
            firstname: "",
            lastname: "",
            email: "",
            // missions: ,
            domaine: Domaine.ANIMATION,
        },
        missions: [
            {
                start: new Date(),
                end: add(new Date(), { months: 3 }),
                status: Status.independent,
                employer: null,
            },
        ],
    };
    const {
        register,
        handleSubmit,
        formState: { errors, isDirty, isSubmitting, isValid },
        setValue,
        getValues,
        control,
        watch,
    } = useForm<createMemberSchemaType>({
        resolver: zodResolver(createMemberSchema),
        mode: "onChange",
        defaultValues,
    });
    const { fields: missionsFields } = useFieldArray({
        rules: { minLength: 1 },
        control,
        name: "missions",
    });

    const [alertMessage, setAlertMessage] = React.useState<{
        title: string;
        message: NonNullable<React.ReactNode>;
        type: "success" | "warning";
    } | null>();
    const [isSaving, setIsSaving] = React.useState(false);
    const [prUrl, setPRURL] = React.useState<string>();

    const firstname = watch("member.firstname");
    const lastname = watch("member.lastname");
    const email = watch("member.email");
    console.log(errors, isDirty, isSubmitting, isValid);
    const onSubmit = async (input: createMemberSchemaType) => {
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
            const { message, pr_url } = await postMemberData({
                values: input,
            });
            setAlertMessage({
                title: `Modifications enregistrées`,
                message,
                type: "success",
            });
            setPRURL(pr_url);
        } catch (e: any) {
            // todo: sentry
            console.log(e);
            Sentry.captureException(e);
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
                <>
                    <h1>Créer une fiche membre</h1>

                    <div className="fr-grid-row fr-grid-row-gutters">
                        <div className="fr-col-12 fr-col-md-12 fr-col-lg-12">
                            <form
                                onSubmit={handleSubmit(onSubmit)}
                                aria-label="Modifier mes informations"
                            >
                                <fieldset
                                    className="fr-mt-5v fr-mb-0v fr-fieldset"
                                    id="identity-fieldset"
                                    aria-labelledby="identity-fieldset-legend identity-fieldset-messages"
                                >
                                    <legend
                                        className="fr-fieldset__legend"
                                        id="identity-fieldset-legend"
                                    >
                                        <h2 className="fr-h3">Informations</h2>
                                    </legend>
                                    <div
                                        className={fr.cx(
                                            "fr-fieldset__element",
                                            "fr-col-12",
                                            "fr-col-lg-4",
                                            "fr-col-md-4",
                                            "fr-col-offset-lg-8--right",
                                            "fr-col-offset-md-8--right"
                                        )}
                                    >
                                        <Input
                                            label={
                                                createMemberSchema.shape.member
                                                    .shape.firstname.description
                                            }
                                            nativeInputProps={{
                                                placeholder: "ex: Grace",
                                                ...register("member.firstname"),
                                            }}
                                            state={
                                                errors.member &&
                                                errors.member.firstname
                                                    ? "error"
                                                    : "default"
                                            }
                                            stateRelatedMessage={
                                                errors.member &&
                                                errors.member?.firstname
                                                    ?.message
                                            }
                                        />
                                    </div>
                                    <div
                                        className={fr.cx(
                                            "fr-fieldset__element",
                                            "fr-col-12",
                                            "fr-col-lg-4",
                                            "fr-col-md-4",
                                            "fr-col-offset-lg-8--right",
                                            "fr-col-offset-md-8--right"
                                        )}
                                    >
                                        <Input
                                            label={
                                                createMemberSchema.shape.member
                                                    .shape.lastname.description
                                            }
                                            nativeInputProps={{
                                                placeholder: "ex: HOPPER",
                                                ...register("member.lastname"),
                                            }}
                                            state={
                                                errors.member &&
                                                errors.member.lastname
                                                    ? "error"
                                                    : "default"
                                            }
                                            stateRelatedMessage={
                                                errors.member &&
                                                errors.member.lastname?.message
                                            }
                                        />
                                    </div>
                                    <div
                                        className={fr.cx(
                                            "fr-fieldset__element",
                                            "fr-col-12",
                                            "fr-col-lg-6",
                                            "fr-col-md-6",
                                            "fr-col-offset-lg-6--right",
                                            "fr-col-offset-md-6--right"
                                        )}
                                    >
                                        <Input
                                            label="Email pro"
                                            hintText="Nous enverrons les informations relatives au compte à cet email"
                                            nativeInputProps={{
                                                placeholder:
                                                    "ex: grace.hopper@gmail.com",
                                                ...register("member.email"),
                                            }}
                                            state={
                                                errors.member &&
                                                errors.member.email
                                                    ? "error"
                                                    : "default"
                                            }
                                            stateRelatedMessage={
                                                errors.member &&
                                                errors.member.email?.message
                                            }
                                        />
                                    </div>
                                </fieldset>
                                <fieldset
                                    className="fr-mt-5v fr-mb-0v fr-fieldset"
                                    id="identity-fieldset"
                                    aria-labelledby="identity-fieldset-legend identity-fieldset-messages"
                                >
                                    <legend
                                        className="fr-fieldset__legend"
                                        id="identity-fieldset-legend"
                                    >
                                        <h2 className="fr-h3">Mission</h2>
                                    </legend>
                                    <div
                                        className={fr.cx(
                                            "fr-fieldset__element",
                                            "fr-col-12",
                                            "fr-col-lg-4",
                                            "fr-col-md-4",
                                            "fr-col-offset-lg-8--right",
                                            "fr-col-offset-md-8--right"
                                        )}
                                    >
                                        <Select
                                            label="Domaine"
                                            nativeSelectProps={{
                                                ...register(`member.domaine`),
                                            }}
                                            state={
                                                errors.member &&
                                                errors.member.domaine
                                                    ? "error"
                                                    : "default"
                                            }
                                            stateRelatedMessage={
                                                errors.member &&
                                                errors.member.domaine?.message
                                            }
                                        >
                                            <option value="" hidden={true}>
                                                Domaine:
                                            </option>
                                            {DOMAINE_OPTIONS.map((domaine) => (
                                                <option
                                                    key={domaine.key}
                                                    value={domaine.name}
                                                >
                                                    {domaine.name}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>
                                    <div className="fr-fieldset__element">
                                        <Mission
                                            isMulti={false}
                                            control={control}
                                            register={register}
                                            setValue={setValue}
                                            startupOptions={
                                                props.startupOptions
                                            }
                                            errors={
                                                errors.missions
                                                    ? errors.missions[0]
                                                    : undefined
                                            }
                                            index={0}
                                            labels={{
                                                start: "Début de la mission",
                                                end: "Fin de la mission",
                                                employer:
                                                    "Entité qui gère la contractualisation",
                                            }}
                                            mission={missionsFields[0]}
                                            missionsRemove={undefined}
                                            onMissionAutoEndClick={(index) => {
                                                const values = getValues();
                                                setValue(
                                                    `missions.${index}.end`,
                                                    add(
                                                        values.missions[0]
                                                            .start,
                                                        { months: 3 }
                                                    )
                                                );
                                            }}
                                        ></Mission>
                                    </div>
                                </fieldset>
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
                        </div>
                    </div>
                </>
            )}
            {!!prUrl && (
                <>
                    <h1>C'est presque bon !</h1>
                    <Alert
                        small={true}
                        severity="info"
                        description={`La fiche membre de ${firstname} ${lastname} doit être validée et mergée sur Github (tu peux le faire, ou demander à quelqu'un de la communauté).`}
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
                        Une fois la fiche validée et mergée, {firstname}{" "}
                        {lastname} recevra des informations à l'adresse {email}.
                    </p>
                </>
            )}
        </>
    );
}
