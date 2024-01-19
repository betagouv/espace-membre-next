"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import React from "react";
import SESelect from "@/components/SESelect";
import { Mission } from "@/models/mission";
import { DBPullRequest } from "@/models/pullRequests";
import routes, { computeRoute } from "@/routes/routes";
import Input from "@codegouvfr/react-dsfr/Input";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useSession } from "@/proxies/next-auth";
import { routeTitles } from "@/utils/routes/routeTitles";
import { Controller, useForm } from "react-hook-form";
import { DevTool } from "@hookform/devtools";

interface Option {
    key: string;
    name: string;
}

interface BaseInfoFormData {
    missions: Mission[];
    end: string;
    start: string;
    previously: {
        value: string;
        label: string;
    }[];
    startups: {
        value: string;
        label: string;
    }[];
    role: string;
}

export interface BaseInfoUpdateProps {
    title: string;
    currentUserId: string;
    errors: string[];
    messages: string[];
    activeTab: string;
    formData: BaseInfoFormData;
    statusOptions: Option[];
    genderOptions: Option[];
    formValidationErrors: any;
    startupOptions: {
        value: string;
        label: string;
    }[];
    username: string;
    updatePullRequest?: DBPullRequest;
    isAdmin: boolean;
}

interface FormErrorResponse {
    errors?: Record<string, string>;
    message: string;
}

import { z } from "zod";

// https://github.com/betagouv/secretariat/issues/247
const employers = [
    "OCTO",
    "DINUM",
    "Codeurs en Liberté",
    "MTES",
    "Ministère de la Culture",
    "Pole Emploi",
    "NUMA",
    "Ministère des Armées",
    "LaZone / ScopyLeft",
    "Agglomération de Pau Béarn Pyrénées",
    "Ministère de l'Intérieur",
    "Département du Pas-de-Calais",
    "EY",
    "UT7",
    "EIG",
    "Ministère des Affaires Sociales",
    "Région Bretagne",
    "DJEPVA",
    "Éducation Nationale",
    "Réseau Canopé",
    "DGCCRF",
    "INOPS",
    "ICC",
    "KeiruaProd",
    "DIRECCTE",
    "Cour des comptes",
    "Ministère des affaires étrangères",
    "Ministère de l'Intérieur",
    "MAS",
    "Ippon/LLL",
    "Arolla",
    "pass-culture",
    "département du Val-d'Oise",
    "département du Nord",
    "drjscs",
    "dila",
    "cnamts",
    "captive",
    "Sogilis Lyon",
    "DGE",
    "CGET",
] as [string, ...string[]]; // TODO: ??

const MissionSchema = z.object({
    start: z.string().describe("Date de début de la mission"),
    end: z.string().describe("Date de début de la mission").optional(),
    status: z
        .enum(["independant", "admin", "service"])
        .describe("Type de contrat"),
    employer: z
        .enum(employers)
        .describe("Entité avec qui vous avez contractualisé"),
});

export const BetaGouvGitHubMemberSchema = z.object({
    role: z
        .string({ required_error: "Le rôle est un champ obligatoire" })
        .describe("Rôle actuel, ex: UX designer"),
    link: z.string().url().optional(),
    github: z.string().describe("Login GitHub").optional(),
    missions: z
        .array(MissionSchema)
        .min(1, "Vous devez définir au moins une mission"),
    startups: z
        .array(z.string())
        .min(1, "Vous devez sélectionner au moins un produit"),
    previously: z.array(z.string()).min(0),
});

export type BetaGouvGitHubMemberSchemaType = z.infer<
    typeof BetaGouvGitHubMemberSchema
>;

export const BetaGouvGitHubMemberPrefillSchema =
    BetaGouvGitHubMemberSchema.deepPartial();
export type BetaGouvGitHubMemberPrefillSchemaType = z.infer<
    typeof BetaGouvGitHubMemberPrefillSchema
>;

/* Pure component */
export const BaseInfoUpdate = (props: BaseInfoUpdateProps) => {
    const defaultValues = props.formData;
    const {
        register,
        handleSubmit,
        formState: { errors, isDirty, isLoading, isValid, isSubmitting },
        watch,
        control,
    } = useForm<BetaGouvGitHubMemberSchemaType>({
        resolver: zodResolver(BetaGouvGitHubMemberSchema),
        defaultValues: {
            ...defaultValues,
            startups: defaultValues.startups.map((s) => s.value),
            previously: defaultValues.startups.map((s) => s.value),
        },
    });

    const onSubmit = async (input: BetaGouvGitHubMemberSchemaType) => {
        //const result = await signUp.mutateAsync(input);
        console.log("onSubmit", input);
        //router.push(linkRegistry.get("signIn", { registered: true }));
    };

    console.log({ props, errors, isValid, isDirty, isLoading, isSubmitting });

    // const [state, setState] = React.useState<any>({
    //     selectedName: "",
    //     ...props,
    //     formData: {
    //         ...props.formData,
    //         start: props.formData.start ? new Date(props.formData.start) : "",
    //         end: props.formData.end ? new Date(props.formData.end) : "",
    //     },
    // });
    // const session = useSession();
    // const [formErrors, setFormErrors] = React.useState<Record<string, string>>(
    //     {}
    // );
    // const [alertMessage, setAlertMessage] = React.useState<{
    //     title: string;
    //     message: NonNullable<React.ReactNode>;
    //     type: "success" | "warning";
    // }>();
    // const [isSaving, setIsSaving] = React.useState(false);

    // const changeFormData = (key, value) => {
    //     const formData = state.formData;
    //     formData[key] = value;
    //     setState({
    //         ...state,
    //         formData,
    //     });
    // };

    // const changesExist = () => {
    //     let changed = false;
    //     if (state.formData.role !== props.formData.role) {
    //         changed = true;
    //     } else if (state.formData.end !== props.formData.end) {
    //         changed = true;
    //     } else if (
    //         state.formData.startups
    //             .map((s) => s.value)
    //             .sort()
    //             .join(",") !==
    //         props.formData.startups
    //             .map((s) => s.value)
    //             .sort()
    //             .join(",")
    //     ) {
    //         changed = true;
    //     } else if (
    //         state.formData.previously
    //             .map((s) => s.value)
    //             .sort()
    //             .join(",") !==
    //         props.formData.previously
    //             .map((s) => s.value)
    //             .sort()
    //             .join(",")
    //     ) {
    //         changed = true;
    //     }
    //     return changed;
    // };

    // const save = async (event) => {
    //     event.preventDefault();
    //     if (isSaving) {
    //         return;
    //     }
    //     setIsSaving(true);
    //     try {
    //         const {
    //             data: { message, pr_url, username },
    //         }: {
    //             data: { message: string; pr_url: string; username: string };
    //         } = await axios.post(
    //             computeRoute(routes.ACCOUNT_POST_BASE_INFO_FORM).replace(
    //                 ":username",
    //                 session.data?.user?.name as string
    //             ),
    //             {
    //                 ...state.formData,
    //                 startups: state.formData.startups.map((s) => s.value),
    //                 previously: state.formData.previously.map((s) => s.value),
    //             },
    //             {
    //                 withCredentials: true,
    //             }
    //         );
    //         setAlertMessage({
    //             title: `⚠️ Pull request pour la mise à jour de la fiche de ${username} ouverte.`,
    //             message: (
    //                 <>
    //                     Demande à un membre de ton équipe de merger ta fiche :{" "}
    //                     <a href={pr_url} target="_blank">
    //                         {pr_url}
    //                     </a>
    //                     .
    //                     <br />
    //                     Une fois mergée, ton profil sera mis à jour.
    //                 </>
    //             ),
    //             type: "success",
    //         });
    //     } catch (e) {
    //         console.log(e);
    //         const ErrorResponse: FormErrorResponse = e as FormErrorResponse;
    //         setAlertMessage({
    //             title: "Erreur",
    //             message: <>{ErrorResponse.message}</>,
    //             type: "warning",
    //         });
    //         setIsSaving(false);
    //         if (ErrorResponse.errors) {
    //             setFormErrors(ErrorResponse.errors);
    //         }
    //     }
    //     setIsSaving(false);
    // };

    return (
        <>
            <div>
                <h1>{routeTitles.accountEditBaseInfo()}</h1>
                {!!props.updatePullRequest && (
                    <Alert
                        className="fr-mb-8v"
                        severity="warning"
                        small={true}
                        closable={false}
                        title="Une pull request existe déjà sur cette fiche."
                        description={
                            <>
                                {`Toi ou un membre de ton équipe doit la merger
                                pour que les changements soient pris en compte : `}
                                <a
                                    href={props.updatePullRequest.url}
                                    target="_blank"
                                >
                                    {props.updatePullRequest.url}
                                </a>
                                <br />
                                (la prise en compte peut prendre 10 minutes.)
                            </>
                        }
                    />
                )}
                {/*!!alertMessage && (
                    <Alert
                        className="fr-mb-8v"
                        severity={alertMessage.type}
                        closable={false}
                        title={alertMessage.title}
                        description={alertMessage.message}
                    />
                ) */}
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    aria-label="Modifier mes informations"
                >
                    <Input
                        label="Rôle chez beta.gouv.fr"
                        nativeInputProps={register("role", {
                            required: true,
                        })}
                        state={errors.role ? "error" : "default"}
                        stateRelatedMessage={errors.role?.message}
                    />

                    {/* missions */}

                    <Controller
                        control={control}
                        rules={{
                            required: true,
                        }}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <SESelect
                                label="Produits actuels :"
                                hint="Produits auxquels tu participes actuellement."
                                startups={props.startupOptions}
                                onChange={onChange}
                                onBlur={onBlur}
                                isMulti={true}
                                placeholder={"Sélectionne un produit"}
                                defaultValue={defaultValues.startups}
                                state={!!errors.startups ? "error" : "default"}
                                stateMessageRelated={errors.startups?.message}
                            />
                        )}
                        name="startups"
                    />

                    <Controller
                        control={control}
                        rules={{
                            required: false,
                        }}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <SESelect
                                label="Produits précédents :"
                                hint="Produits auxquels tu as participé précédemment."
                                startups={props.startupOptions}
                                onChange={onChange}
                                onBlur={onBlur}
                                isMulti={true}
                                placeholder={"Sélectionne un produit"}
                                defaultValue={props.formData.previously}
                                state={
                                    !!errors.previously ? "error" : "default"
                                }
                                stateMessageRelated={errors.previously?.message}
                            />
                        )}
                        name="previously"
                    />

                    <Button
                        children={
                            isSubmitting
                                ? `Enregistrement en cours...`
                                : `Enregistrer`
                        }
                        nativeButtonProps={{
                            type: "submit",
                            disabled: !isDirty || isSubmitting, //isSubmitting || !isDirty,
                        }}
                    />
                </form>

                <DevTool control={control} />
            </div>
        </>
    );
};
