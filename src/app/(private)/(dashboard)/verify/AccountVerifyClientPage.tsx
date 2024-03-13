"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";

import { CreateMemberType } from "../community/create/CommunityCreateMemberPage";
import { MissionsEditor } from "@/components/BaseInfoUpdatePage/MissionsEditor";
import CitySelect from "@/components/CitySelect";
import CommunicationEmailSelect from "@/components/CommunicationEmailSelect";
import GenderSelect from "@/components/GenderSelect";
import SESelect from "@/components/SESelect";
import { userStatusOptions } from "@/frontConfig";
import { GenderCode, statusOptions } from "@/models/dbUser";
import {
    DOMAINE_OPTIONS,
    Domaine,
    completeMemberSchema,
    completeMemberSchemaType,
    memberSchema,
    memberSchemaType,
} from "@/models/member";
import { Status, missionSchema } from "@/models/mission";
import { useSession } from "@/proxies/next-auth";
import routes, { computeRoute } from "@/routes/routes";

// data from secretariat API
export interface AccountVerifyClientPageProps {
    startupOptions: {
        value: string;
        label: string;
    }[];
    formData: completeMemberSchemaType;
}

const postMemberData = async ({ values, sessionUsername }) => {
    try {
        const response = await fetch(
            computeRoute(routes.ACCOUNT_UPDATE_INFO_API).replace(
                ":username",
                sessionUsername
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

export default function AccountVerifyClientPage(
    props: AccountVerifyClientPageProps
) {
    const router = useRouter();

    const defaultValues: completeMemberSchemaType = {
        ...props.formData,
    };
    const {
        register,
        handleSubmit,
        formState: { errors, isDirty, isSubmitting, isValid },
        setValue,
        control,
    } = useForm<completeMemberSchemaType>({
        resolver: zodResolver(completeMemberSchema),
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

    const onSubmit = async (input: completeMemberSchemaType) => {
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
                aria-label="Modifier mes informations"
            >
                <Input
                    label="Prénom Nom"
                    nativeInputProps={{
                        placeholder: "ex: HOPPER",
                        ...register("fullname"),
                    }}
                    state={errors.fullname ? "error" : "default"}
                    stateRelatedMessage={errors.fullname?.message}
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
                <MissionsEditor
                    control={control}
                    setValue={setValue}
                    register={register}
                    startupOptions={props.startupOptions}
                    errors={errors.missions || []}
                />
                <h3>Sur l'annuaire</h3>
                <Input
                    label="Courte bio"
                    nativeInputProps={{
                        placeholder: "ex: Grace",
                        ...register("bio"),
                    }}
                    state={errors.bio ? "error" : "default"}
                    stateRelatedMessage={errors.bio?.message}
                />
                <Input
                    label="Site personnel"
                    nativeInputProps={{
                        placeholder: "ex: HOPPER",
                        ...register("link"),
                    }}
                    state={errors.link ? "error" : "default"}
                    stateRelatedMessage={errors.link?.message}
                />
                <h3>Droits Github</h3>
                <Input
                    label="Github"
                    hintText="Indispensable pour les devs"
                    nativeInputProps={{
                        placeholder: "ex: HOPPER",
                        ...register("github"),
                    }}
                    state={errors.github ? "error" : "default"}
                    stateRelatedMessage={errors.github?.message}
                />
                <h3>Informations statistiques</h3>
                <p>
                    Cette information servent uniquement à des fins statistiques
                    pour l'observatoire de la communauté. Elles sont
                    anonymisées.
                </p>
                <GenderSelect
                    label="Genre"
                    nativeSelectProps={{
                        ...register("gender"),
                    }}
                    state={errors.gender ? "error" : "default"}
                    stateRelatedMessage={errors.gender?.message}
                />
                <CitySelect
                    onChange={handleCitySelect}
                    placeholder={"Commune ou code postal"}
                    state={errors.workplace_insee_code ? "error" : "default"}
                    stateRelatedMessage={errors.workplace_insee_code?.message}
                    defaultValue={""}
                />
                <Select
                    label="Statut"
                    nativeSelectProps={{
                        ...register(`legal_status`),
                    }}
                >
                    <option value="" disabled hidden>
                        Selectionnez une option
                    </option>
                    {statusOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                            {option.name}
                        </option>
                    ))}
                </Select>{" "}
                <Input
                    label="TJM moyen HT (si tu es indépendant)"
                    hintText="Cette information est utilisée uniquement pour
                                    faire des statistiques. Elle n'est pas affichée."
                    nativeInputProps={{
                        ...register("tjm", { valueAsNumber: true }),
                        type: "number",
                    }}
                    state={errors.tjm ? "error" : "default"}
                    stateRelatedMessage={errors.tjm?.message}
                />
                <Input
                    label="Nombre de jours moyen travaillés par semaine"
                    hintText="Tu pourras changer plus tard"
                    nativeInputProps={{
                        ...register("average_nb_of_days", {
                            valueAsNumber: true,
                        }),

                        type: "number",
                    }}
                    state={errors.average_nb_of_days ? "error" : "default"}
                    stateRelatedMessage={errors.average_nb_of_days?.message}
                />
                <Button
                    className={fr.cx("fr-mt-3w")}
                    children={
                        isSubmitting
                            ? `Mise à jour en cours...`
                            : `Mettre à jour mes informations`
                    }
                    nativeButtonProps={{
                        type: "submit",
                        disabled: !isDirty || isSubmitting,
                    }}
                />
            </form>
        </>
    );
}
