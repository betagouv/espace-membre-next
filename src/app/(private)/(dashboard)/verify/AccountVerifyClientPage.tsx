"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useFieldArray, useForm } from "react-hook-form";

import { CompetencesEditor } from "@/components/BaseInfoUpdatePage/CompetencesEditor";
import { Mission } from "@/components/BaseInfoUpdatePage/MissionsEditor";
import CitySelect from "@/components/CitySelect";
import GenderSelect from "@/components/GenderSelect";
import { memberTypeOptions } from "@/frontConfig";
import {
    memberValidateInfoSchema,
    memberValidateInfoSchemaType,
} from "@/models/actions/member";
import { statusOptions } from "@/models/dbUser";
import {
    DOMAINE_OPTIONS,
    memberSchema,
    memberSchemaType,
} from "@/models/member";
import routes, { computeRoute } from "@/routes/routes";

// data from secretariat API
export interface AccountVerifyClientPageProps {
    startupOptions: {
        value: string;
        label: string;
    }[];
    member: memberSchemaType;
}

const postMemberData = async ({ values, sessionUsername }) => {
    try {
        const response = await fetch(
            computeRoute(
                routes.ACCOUNT_UPDATE_INFO_API.replace(
                    ":username",
                    sessionUsername
                )
            ),
            {
                method: "PUT", // Specify the method
                body: JSON.stringify(values), // Convert the values object to JSON
                headers: {
                    "Content-Type": "application/json", // Specify the content type
                },
            }
        );

        if (!response.ok) {
            throw new Error("Network response was not ok");
        }

        const { username, message } = await response.json(); // Destructure the data from the response

        return { username, message }; // Return the username and message
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
        throw error; // Rethrow the error to be handled by the caller
    }
};

export default function AccountVerifyClientPage({
    member,
    startupOptions,
}: AccountVerifyClientPageProps) {
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty, isSubmitting, isValid },
        setValue,
        control,
    } = useForm<memberValidateInfoSchemaType>({
        resolver: zodResolver(memberValidateInfoSchema),
        mode: "onChange",
        defaultValues: {
            ...member,
        },
    });
    const { fields: missionsFields } = useFieldArray({
        rules: { minLength: 1 },
        control,
        name: "missions",
    });

    const session = useSession();

    const [alertMessage, setAlertMessage] = React.useState<{
        title: string;
        message: NonNullable<React.ReactNode>;
        type: "success" | "warning";
    } | null>();
    const [isSaving, setIsSaving] = React.useState(false);

    const onSubmit = async (input: memberValidateInfoSchemaType) => {
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
                sessionUsername: session.data?.user.id as string,
            });
            setAlertMessage({
                title: `Modifications enregistrées`,
                message,
                type: "success",
            });
            router.push("/account", { scroll: false });
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
            <div className="fr-container fr-container--fluid fr-mb-md-14v fr-mt-8v">
                {!!alertMessage && (
                    <Alert
                        className="fr-mb-8v"
                        severity={alertMessage.type}
                        closable={false}
                        title={alertMessage.title}
                    />
                )}
                <div className="fr-grid-row fr-grid-row-gutters fr-grid-row--center">
                    <div className="fr-col-12 fr-col-md-12 fr-col-lg-12">
                        <div className="fr-container fr-background-alt--grey">
                            <Alert
                                className="fr-mb-8v"
                                severity={"info"}
                                closable={false}
                                small={true}
                                description={
                                    <>
                                        <b>Vérifie les informations</b> de ton
                                        compte
                                    </>
                                }
                            />
                            <h1>Vérifier ma fiche</h1>

                            <div className="fr-grid-row fr-grid-row-gutters">
                                <div className="fr-col-12 fr-col-md-10 fr-col-lg-10">
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
                                                <h2 className="fr-h3">
                                                    Informations
                                                </h2>
                                            </legend>
                                            <div className="fr-fieldset__element">
                                                <p className="fr-hint-text">
                                                    Sauf mention contraire, tous
                                                    les champs sont
                                                    obligatoires.
                                                </p>
                                            </div>
                                            <div className="fr-fieldset__element fr-col-12 fr-col-lg-8 fr-col-md-8">
                                                <Input
                                                    label={
                                                        memberSchema.shape
                                                            .fullname
                                                            .description
                                                    }
                                                    nativeInputProps={{
                                                        placeholder:
                                                            "ex: Grace HOPPER",
                                                        ...register("fullname"),
                                                    }}
                                                    state={
                                                        errors.fullname
                                                            ? "error"
                                                            : "default"
                                                    }
                                                    stateRelatedMessage={
                                                        errors.fullname?.message
                                                    }
                                                />
                                            </div>
                                            <div className="fr-fieldset__element fr-col-12 fr-col-lg-8 fr-col-md-8">
                                                <Input
                                                    label="Email pro"
                                                    hintText="Un email professionel qui nous servira pour t'envoyer les informations relatives à ton compte"
                                                    nativeInputProps={{
                                                        placeholder:
                                                            "ex: grace.hopper@gmail.com",
                                                        ...register(
                                                            "secondary_email"
                                                        ),
                                                    }}
                                                    state={
                                                        errors.secondary_email
                                                            ? "error"
                                                            : "default"
                                                    }
                                                    stateRelatedMessage={
                                                        errors.secondary_email
                                                            ?.message
                                                    }
                                                />
                                            </div>
                                            <div className="fr-fieldset__element fr-col-12 fr-mt-4w">
                                                <h3>Mes compétences</h3>
                                                <p>
                                                    Tu peux préciser tes
                                                    compétences, cela permettra
                                                    à la communauté de mieux de
                                                    trouver en cas de besoin :)
                                                </p>
                                                <CompetencesEditor
                                                    onChange={(e, values) => {
                                                        setValue(
                                                            "competences",
                                                            values,
                                                            {
                                                                shouldDirty:
                                                                    true,
                                                            }
                                                        );
                                                    }}
                                                    defaultValue={
                                                        member.competences || []
                                                    }
                                                />
                                                <br />
                                            </div>
                                        </fieldset>
                                        <fieldset
                                            className="fr-mt-10v fr-mb-0v fr-fieldset"
                                            id="identity-fieldset"
                                            aria-labelledby="identity-fieldset-legend identity-fieldset-messages"
                                        >
                                            <legend
                                                className="fr-fieldset__legend"
                                                id="identity-fieldset-legend"
                                            >
                                                <h2 className="fr-h3">
                                                    Mission
                                                </h2>
                                            </legend>
                                            <div className="fr-fieldset__element fr-col-12 fr-col-lg-8 fr-col-md-8">
                                                <Input
                                                    label={
                                                        memberSchema.shape.role
                                                            .description
                                                    }
                                                    hintText="ex: Développeuse à MonSuperProduit"
                                                    nativeInputProps={{
                                                        placeholder:
                                                            "ex: Développeuse",
                                                        ...register("role"),
                                                    }}
                                                    state={
                                                        errors.role
                                                            ? "error"
                                                            : "default"
                                                    }
                                                    stateRelatedMessage={
                                                        errors.role?.message
                                                    }
                                                />
                                            </div>
                                            <div className="fr-fieldset__element fr-col-12 fr-col-lg-6 fr-col-md-6">
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
                                                    <option value="">
                                                        Domaine:
                                                    </option>
                                                    {DOMAINE_OPTIONS.map(
                                                        (domaine) => (
                                                            <option
                                                                key={
                                                                    domaine.key
                                                                }
                                                                value={
                                                                    domaine.name
                                                                }
                                                            >
                                                                {domaine.name}
                                                            </option>
                                                        )
                                                    )}
                                                </Select>
                                            </div>
                                            <div className="fr-fieldset__element">
                                                <Mission
                                                    isMulti={false}
                                                    control={control}
                                                    register={register}
                                                    setValue={setValue}
                                                    startupOptions={
                                                        startupOptions
                                                    }
                                                    errors={
                                                        errors.missions
                                                            ? errors.missions[0]
                                                            : undefined
                                                    }
                                                    index={0}
                                                    mission={missionsFields[0]}
                                                    missionsRemove={undefined}
                                                    onMissionAutoEndClick={
                                                        undefined
                                                    }
                                                ></Mission>
                                            </div>
                                        </fieldset>
                                        <fieldset
                                            className="fr-mt-4v fr-mb-0v fr-fieldset"
                                            id="identity-fieldset"
                                            aria-labelledby="identity-fieldset-legend identity-fieldset-messages"
                                        >
                                            <legend
                                                className="fr-fieldset__legend"
                                                id="identity-fieldset-legend"
                                            >
                                                <h2 className="fr-h3">
                                                    Sur l'annuaire
                                                </h2>
                                            </legend>
                                            <div className="fr-fieldset__element fr-col-12 fr-col-lg-8 fr-col-md-8">
                                                <Input
                                                    textArea
                                                    label={
                                                        memberSchema.shape.bio
                                                            .description
                                                    }
                                                    nativeTextAreaProps={{
                                                        ...register("bio"),
                                                    }}
                                                    state={
                                                        errors.bio
                                                            ? "error"
                                                            : "default"
                                                    }
                                                    stateRelatedMessage={
                                                        errors.bio?.message
                                                    }
                                                />
                                            </div>
                                            <div className="fr-col-12 fr-col-lg-6 fr-col-md-6">
                                                <div className="fr-fieldset__element">
                                                    <Input
                                                        label={
                                                            memberSchema.shape
                                                                .link
                                                                .description
                                                        }
                                                        nativeInputProps={{
                                                            placeholder:
                                                                "ex: https://linkedin.com/in/xxxx",
                                                            ...register("link"),
                                                        }}
                                                        state={
                                                            errors.link
                                                                ? "error"
                                                                : "default"
                                                        }
                                                        stateRelatedMessage={
                                                            errors.link?.message
                                                        }
                                                    />
                                                </div>
                                                <div className="fr-fieldset__element">
                                                    <Select
                                                        label="Type de membre"
                                                        nativeSelectProps={{
                                                            ...register(
                                                                `memberType`
                                                            ),
                                                        }}
                                                    >
                                                        <option
                                                            value=""
                                                            disabled
                                                            hidden
                                                        >
                                                            Selectionnez une
                                                            option
                                                        </option>
                                                        {memberTypeOptions.map(
                                                            (option) => (
                                                                <option
                                                                    key={
                                                                        option.key
                                                                    }
                                                                    value={
                                                                        option.key
                                                                    }
                                                                >
                                                                    {
                                                                        option.name
                                                                    }
                                                                </option>
                                                            )
                                                        )}
                                                    </Select>
                                                </div>
                                            </div>
                                        </fieldset>
                                        <fieldset
                                            className="fr-mt-10v fr-mb-0v fr-fieldset"
                                            id="identity-fieldset"
                                            aria-labelledby="identity-fieldset-legend identity-fieldset-messages"
                                        >
                                            <legend
                                                className="fr-fieldset__legend"
                                                id="identity-fieldset-legend"
                                            >
                                                <h2 className="fr-h3">
                                                    Droits Github
                                                </h2>
                                            </legend>
                                            <div className="fr-fieldset__element">
                                                <Input
                                                    label="Github"
                                                    hintText="Indispensable pour les devs"
                                                    nativeInputProps={{
                                                        placeholder:
                                                            "ex: HOPPER",
                                                        ...register("github"),
                                                    }}
                                                    state={
                                                        errors.github
                                                            ? "error"
                                                            : "default"
                                                    }
                                                    stateRelatedMessage={
                                                        errors.github?.message
                                                    }
                                                />
                                            </div>
                                        </fieldset>
                                        <fieldset
                                            className="fr-mt-10v fr-mb-0v fr-fieldset"
                                            id="identity-fieldset"
                                            aria-labelledby="identity-fieldset-legend identity-fieldset-messages"
                                        >
                                            <legend
                                                className="fr-fieldset__legend"
                                                id="identity-fieldset-legend"
                                            >
                                                <h2 className="fr-h3">
                                                    Informations statistiques
                                                </h2>
                                            </legend>
                                            <div className="fr-fieldset__element">
                                                <p className="fr-hint-text">
                                                    Ces informations servent
                                                    uniquement à des fins
                                                    statistiques pour
                                                    l'observatoire de la
                                                    communauté. Elles sont
                                                    anonymisées.
                                                </p>
                                            </div>
                                            <div className="fr-col-12 fr-col-lg-6 fr-col-md-6">
                                                <div className="fr-fieldset__element">
                                                    <GenderSelect
                                                        label="Genre"
                                                        nativeSelectProps={{
                                                            ...register(
                                                                "gender"
                                                            ),
                                                        }}
                                                        state={
                                                            errors.gender
                                                                ? "error"
                                                                : "default"
                                                        }
                                                        stateRelatedMessage={
                                                            errors.gender
                                                                ?.message
                                                        }
                                                    />
                                                </div>
                                                <div className="fr-fieldset__element">
                                                    <CitySelect
                                                        onChange={
                                                            handleCitySelect
                                                        }
                                                        placeholder={
                                                            "Commune ou code postal"
                                                        }
                                                        state={
                                                            errors.workplace_insee_code
                                                                ? "error"
                                                                : "default"
                                                        }
                                                        stateRelatedMessage={
                                                            errors
                                                                .workplace_insee_code
                                                                ?.message
                                                        }
                                                        defaultValue={""}
                                                    />
                                                </div>
                                                <div className="fr-fieldset__element">
                                                    <Select
                                                        label="Statut"
                                                        nativeSelectProps={{
                                                            ...register(
                                                                `legal_status`
                                                            ),
                                                        }}
                                                    >
                                                        <option
                                                            value=""
                                                            disabled
                                                            hidden
                                                        >
                                                            Selectionnez une
                                                            option
                                                        </option>
                                                        {statusOptions.map(
                                                            (option) => (
                                                                <option
                                                                    key={
                                                                        option.key
                                                                    }
                                                                    value={
                                                                        option.key
                                                                    }
                                                                >
                                                                    {
                                                                        option.name
                                                                    }
                                                                </option>
                                                            )
                                                        )}
                                                    </Select>
                                                </div>
                                                <div className="fr-fieldset__element">
                                                    <Input
                                                        label="TJM moyen HT (si tu es indépendant)"
                                                        hintText="Cette information est utilisée uniquement pour
                                    faire des statistiques. Elle n'est pas affichée."
                                                        nativeInputProps={{
                                                            ...register("tjm", {
                                                                setValueAs: (
                                                                    // use this instead of valueAsNumber to handle undefined value
                                                                    v
                                                                ) =>
                                                                    v === ""
                                                                        ? null
                                                                        : parseInt(
                                                                              v
                                                                          ),
                                                            }),
                                                            type: "number",
                                                        }}
                                                        state={
                                                            errors.tjm
                                                                ? "error"
                                                                : "default"
                                                        }
                                                        stateRelatedMessage={
                                                            errors.tjm?.message
                                                        }
                                                    />
                                                </div>
                                                <div className="fr-fieldset__element ">
                                                    <Input
                                                        label="Nombre de jours moyen travaillés par semaine"
                                                        hintText="Tu pourras changer plus tard"
                                                        nativeInputProps={{
                                                            ...register(
                                                                "average_nb_of_days",
                                                                {
                                                                    setValueAs:
                                                                        (
                                                                            // use this instead of valueAsNumber to handle undefined value
                                                                            v
                                                                        ) =>
                                                                            v ===
                                                                            ""
                                                                                ? null
                                                                                : parseInt(
                                                                                      v
                                                                                  ),
                                                                }
                                                            ),

                                                            type: "number",
                                                        }}
                                                        state={
                                                            errors.average_nb_of_days
                                                                ? "error"
                                                                : "default"
                                                        }
                                                        stateRelatedMessage={
                                                            errors
                                                                .average_nb_of_days
                                                                ?.message
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </fieldset>

                                        <Button
                                            className={fr.cx("fr-mt-3w")}
                                            children={
                                                isSubmitting
                                                    ? `Mise à jour en cours...`
                                                    : `Mettre à jour mes informations`
                                            }
                                            nativeButtonProps={{
                                                type: "submit",
                                                disabled: isSubmitting,
                                            }}
                                        />
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
