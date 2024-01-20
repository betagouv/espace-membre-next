"use client";
import React from "react";
import { z } from "zod";

import Input from "@codegouvfr/react-dsfr/Input";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { fr } from "@codegouvfr/react-dsfr";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { DevTool } from "@hookform/devtools";

import SESelect from "@/components/SESelect";
import { Mission } from "@/models/mission";
import { DBPullRequest } from "@/models/pullRequests";
import { routeTitles } from "@/utils/routes/routeTitles";

import { employers } from "./employers";
import { MissionsEditor } from "./MissionsEditor";

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
    startups: z.array(z.string()),
    previously: z.array(z.string()),
});

export type BetaGouvGitHubMemberSchemaType = z.infer<
    typeof BetaGouvGitHubMemberSchema
>;

export const BetaGouvGitHubMemberPrefillSchema =
    BetaGouvGitHubMemberSchema.deepPartial();
export type BetaGouvGitHubMemberPrefillSchemaType = z.infer<
    typeof BetaGouvGitHubMemberPrefillSchema
>;

const StartupsEditor = ({ name, control, startups, ...props }) => {
    return (
        <Controller
            control={control}
            rules={{
                required: true,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
                <SESelect
                    onChange={onChange}
                    onBlur={onBlur}
                    isMulti={true}
                    placeholder={"Sélectionne un produit"}
                    startups={startups}
                    {...props}
                />
            )}
            name={name}
        />
    );
};

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

    return (
        <>
            <div>
                <h1>{routeTitles.accountEditBaseInfo()}</h1>
                <p>
                    Ces informations seront publiées sur le site beta.gouv.fr.
                </p>
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
                        nativeInputProps={{
                            placeholder: "ex: UX designer",
                            ...register("role", {
                                required: true,
                            }),
                        }}
                        state={errors.role ? "error" : "default"}
                        stateRelatedMessage={errors.role?.message}
                    />

                    <h3>Mes missions</h3>

                    <MissionsEditor control={control} register={register} />

                    <h3>Mes startups </h3>

                    <StartupsEditor
                        name="startups"
                        control={control}
                        startups={props.startupOptions}
                        label="Produits actuels :"
                        hint="Produits auxquels tu participes actuellement."
                        defaultValue={defaultValues.startups}
                        state={!!errors.startups ? "error" : "default"}
                        stateMessageRelated={errors.startups?.message}
                    />

                    <StartupsEditor
                        name="previously"
                        control={control}
                        startups={props.startupOptions}
                        label="Produits précédents :"
                        hint="Produits auxquels tu as participé précédemment."
                        defaultValue={defaultValues.previously}
                        state={!!errors.previously ? "error" : "default"}
                        stateMessageRelated={errors.previously?.message}
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
                            disabled: !isDirty || isSubmitting, //isSubmitting || !isDirty,
                        }}
                    />
                </form>

                <DevTool control={control} />
            </div>
        </>
    );
};
