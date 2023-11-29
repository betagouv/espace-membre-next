"use client";
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

/* Pure component */
export const BaseInfoUpdate = (props: BaseInfoUpdateProps) => {
    const [state, setState] = React.useState<any>({
        selectedName: "",
        ...props,
        formData: {
            ...props.formData,
            start: props.formData.start ? new Date(props.formData.start) : "",
            end: props.formData.end ? new Date(props.formData.end) : "",
        },
    });
    const session = useSession();
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>(
        {}
    );
    const [alertMessage, setAlertMessage] = React.useState<{
        title: string;
        message: NonNullable<React.ReactNode>;
        type: "success" | "warning";
    }>();
    const [isSaving, setIsSaving] = React.useState(false);

    const changeFormData = (key, value) => {
        const formData = state.formData;
        formData[key] = value;
        setState({
            ...state,
            formData,
        });
    };

    const changesExist = () => {
        console.log(state.formData);

        let changed = false;
        if (state.formData.role !== props.formData.role) {
            changed = true;
        } else if (state.formData.end !== props.formData.end) {
            changed = true;
        } else if (
            state.formData.startups
                .map((s) => s.value)
                .sort()
                .join(",") !==
            props.formData.startups
                .map((s) => s.value)
                .sort()
                .join(",")
        ) {
            changed = true;
        } else if (
            state.formData.previously
                .map((s) => s.value)
                .sort()
                .join(",") !==
            props.formData.previously
                .map((s) => s.value)
                .sort()
                .join(",")
        ) {
            changed = true;
        }
        return changed;
    };

    const save = async (event) => {
        event.preventDefault();
        if (isSaving) {
            return;
        }
        setIsSaving(true);
        console.log(state.formData);
        try {
            const {
                data: { message, pr_url, username },
            }: {
                data: { message: string; pr_url: string; username: string };
            } = await axios.post(
                computeRoute(routes.ACCOUNT_POST_BASE_INFO_FORM).replace(
                    ":username",
                    session.data?.user?.name as string
                ),
                {
                    ...state.formData,
                    startups: state.formData.startups.map((s) => s.value),
                    previously: state.formData.previously.map((s) => s.value),
                },
                {
                    withCredentials: true,
                }
            );
            setAlertMessage({
                title: `⚠️ Pull request pour la mise à jour de la fiche de ${username} ouverte.`,
                message: (
                    <>
                        Demande à un membre de ton équipe de merger ta fiche :{" "}
                        <a href={pr_url} target="_blank">
                            {pr_url}
                        </a>
                        .
                        <br />
                        Une fois mergée, ton profil sera mis à jour.
                    </>
                ),
                type: "success",
            });
        } catch (e) {
            console.log(e);
            const ErrorResponse: FormErrorResponse = e as FormErrorResponse;
            setAlertMessage({
                title: "Erreur",
                message: <>{ErrorResponse.message}</>,
                type: "warning",
            });
            setIsSaving(false);
            if (ErrorResponse.errors) {
                setFormErrors(ErrorResponse.errors);
            }
        }
        setIsSaving(false);
    };

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
                                pour que les changements soit pris en compte : `}
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
                {!!alertMessage && (
                    <Alert
                        className="fr-mb-8v"
                        severity={alertMessage.type}
                        closable={false}
                        title={alertMessage.title}
                        description={alertMessage.message}
                    />
                )}
                <form onSubmit={save}>
                    <Input
                        label="Rôle chez beta.gouv.fr"
                        nativeInputProps={{
                            name: "role",
                            onChange: (e: {
                                currentTarget: { value: string };
                            }) => {
                                changeFormData("role", e.currentTarget.value);
                            },
                            value: state.formData.role,
                            required: true,
                        }}
                        state={!!formErrors["role"] ? "error" : "default"}
                        stateRelatedMessage={formErrors["role"]}
                    />
                    <SESelect
                        label="Produits actuels :"
                        hint="Produits auxquels tu participes actuellement."
                        startups={props.startupOptions}
                        onChange={(startups) => {
                            changeFormData("startups", startups);
                        }}
                        isMulti={true}
                        placeholder={"Sélectionne un produit"}
                        defaultValue={props.formData.startups}
                        state={!!formErrors["startups"] ? "error" : "default"}
                        stateMessageRelated={formErrors["startups"]}
                    />
                    <SESelect
                        label="Produits précédents :"
                        hint="Produits auxquels tu as participé précédemment."
                        startups={props.startupOptions}
                        onChange={(startups) => {
                            changeFormData("previously", startups);
                        }}
                        isMulti={true}
                        placeholder={"Sélectionne un produit"}
                        defaultValue={props.formData.previously}
                        state={!!formErrors["startups"] ? "error" : "default"}
                        stateMessageRelated={formErrors["startups"]}
                    />
                    <Input
                        label={"Fin de la mission (obligatoire) :"}
                        hintText={
                            <>
                                Si tu ne la connais pas, mets une date dans 6
                                mois, tu pourras la corriger plus tard.
                                <br />
                                <i>Au format JJ/MM/YYYY</i>
                            </>
                        }
                        nativeInputProps={{
                            type: "date",
                            name: "endDate",
                            min: "2020-01-31",
                            title: "En format YYYY-MM-DD, par exemple : 2020-01-31",
                            required: true,
                            defaultValue: props.formData.end,
                            onChange: (e) =>
                                changeFormData("end", e.target.value),
                        }}
                    />
                    <Button
                        children={
                            isSaving
                                ? `Enregistrement en cours...`
                                : `Enregistrer`
                        }
                        nativeButtonProps={{
                            type: "submit",
                            disabled: isSaving || !changesExist(),
                        }}
                    />
                </form>
            </div>
        </>
    );
};
