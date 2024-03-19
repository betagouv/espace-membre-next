"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Sentry from "@sentry/nextjs";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { createMember as createMemberAction } from "@/app/actions/member";
import { Mission } from "@/components/BaseInfoUpdatePage/MissionsEditor";
import { DOMAINE_OPTIONS, Domaine, createMemberSchema } from "@/models/member";
import { Status } from "@/models/mission";

// data from secretariat API
export interface BaseInfoUpdateProps {
    startupOptions: {
        value: string;
        label: string;
    }[];
}

export type CreateMemberType = z.infer<typeof createMemberSchema>;

export default function CommunityCreateMemberPage(props: BaseInfoUpdateProps) {
    const defaultValues: CreateMemberType = {
        firstname: "",
        lastname: "",
        email: "",
        missions: [
            {
                start: new Date(),
                status: Status.independent,
            },
        ],
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
                                                createMemberSchema.shape
                                                    .firstname.description
                                            }
                                            nativeInputProps={{
                                                placeholder: "ex: Grace",
                                                ...register("firstname"),
                                            }}
                                            state={
                                                errors.firstname
                                                    ? "error"
                                                    : "default"
                                            }
                                            stateRelatedMessage={
                                                errors.firstname?.message
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
                                                createMemberSchema.shape
                                                    .lastname.description
                                            }
                                            nativeInputProps={{
                                                placeholder: "ex: HOPPER",
                                                ...register("lastname"),
                                            }}
                                            state={
                                                errors.lastname
                                                    ? "error"
                                                    : "default"
                                            }
                                            stateRelatedMessage={
                                                errors.lastname?.message
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
                                            hintText="Un email professionel qui nous servira pour t'envoyer les informations relatives à ton compte"
                                            nativeInputProps={{
                                                placeholder:
                                                    "ex: grace.hopper@gmail.com",
                                                ...register("secondary_email"),
                                            }}
                                            state={
                                                errors.email
                                                    ? "error"
                                                    : "default"
                                            }
                                            stateRelatedMessage={
                                                errors.email?.message
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
                                                ...register(`domaine`),
                                            }}
                                            state={
                                                errors.domaine
                                                    ? "error"
                                                    : "default"
                                            }
                                            stateRelatedMessage={
                                                errors.domaine?.message
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
                                            mission={missionsFields[0]}
                                            missionsRemove={undefined}
                                            onMissionAutoEndClick={undefined}
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
