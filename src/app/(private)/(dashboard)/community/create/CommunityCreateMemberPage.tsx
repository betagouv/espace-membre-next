"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Sentry from "@sentry/nextjs";
import { add, addMonths } from "date-fns";
import { useFieldArray, useForm } from "react-hook-form";

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
                // @ts-ignore
                status: null,
                // @ts-ignore
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

    const [isSaving, setIsSaving] = React.useState(false);
    const [success, setSuccess] = React.useState<null | boolean>(null);
    const [alertMessage, setAlertMessage] = React.useState<{
        title: string;
        message: NonNullable<React.ReactNode>;
        type: "success" | "warning" | "error" | "info";
    } | null>();

    const firstname = watch("member.firstname");
    const lastname = watch("member.lastname");

    const onSubmit = async (input: createMemberSchemaType) => {
        if (isSaving) {
            return;
        }
        if (!isValid) {
            console.log("invalid");
            return;
        }
        setIsSaving(true);
        setSuccess(null);
        const response = await fetch(
            computeRoute(routes.ACCOUNT_POST_INFO_API),
            {
                method: "POST", // Specify the method
                body: JSON.stringify(input), // Convert the values object to JSON
                headers: {
                    "Content-Type": "application/json", // Specify the content type
                },
            }
        );
        setIsSaving(false);
        const data = await response.json();
        if (response.ok) {
            setSuccess(true);
            setAlertMessage({
                title: "C'est presque bon !",
                type: "info",
                message: `${firstname} ${lastname} va recevoir un email pour l'inviter à se connecter à l'espace membre et compléter sa fiche`,
            });
        } else {
            setSuccess(false);
            setAlertMessage({
                title: "Erreur lors de la création de la fiche",
                type: "error",
                message: data.message,
            });
        }
        document.body.scrollIntoView();
    };

    return (
        <>
            <h1>Créer une fiche membre</h1>

            {!!alertMessage && (
                <Alert
                    className="fr-mb-8v"
                    severity={alertMessage.type}
                    closable={false}
                    small={true}
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
            {success !== true && (
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
                                                .shape.firstname.description +
                                            " (obligatoire)"
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
                                            errors.member?.firstname?.message
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
                                                .shape.lastname.description +
                                            " (obligatoire)"
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
                                        label="Email pro (obligatoire)"
                                        hintText="Nous enverrons les informations relatives au compte à cet email"
                                        nativeInputProps={{
                                            placeholder:
                                                "ex: grace.hopper@gmail.com",
                                            ...register("member.email"),
                                        }}
                                        state={
                                            errors.member && errors.member.email
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
                                        label="Domaine (obligatoire)"
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
                                        <option
                                            value=""
                                            hidden
                                            selected
                                            disabled
                                        >
                                            Sélectionner une option
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
                                        startupOptions={props.startupOptions}
                                        errors={
                                            errors.missions
                                                ? errors.missions[0]
                                                : undefined
                                        }
                                        index={0}
                                        labels={{
                                            start: "Début de la mission (obligatoire)",
                                            end: "Fin de la mission (obligatoire)",
                                            employer:
                                                "Entité qui gère la contractualisation (obligatoire)",
                                            status: "Type de contrat (obligatoire)",
                                        }}
                                        mission={missionsFields[0]}
                                        missionsRemove={undefined}
                                        onMissionAutoEndClick={(index) => {
                                            const values = getValues();
                                            let startDate;
                                            try {
                                                startDate = values.missions[
                                                    index
                                                ].start
                                                    ? new Date(
                                                          values.missions[
                                                              index
                                                          ].start
                                                      )
                                                    : new Date();
                                            } catch (e) {
                                                startDate = new Date();
                                            }
                                            const endDate = addMonths(
                                                startDate,
                                                3
                                            );
                                            setValue(
                                                `missions.${index}.end`,
                                                endDate
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
            )}
        </>
    );
}
