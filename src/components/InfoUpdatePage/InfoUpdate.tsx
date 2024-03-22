"use client";

import React from "react";

import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import Select from "@codegouvfr/react-dsfr/Select";
import axios from "axios";

import CitySelect from "../CitySelect";
import { CommuneInfo } from "@/models/communeInfo";
import { FormErrorResponse, Option } from "@/models/misc";
import routes, { computeRoute } from "@/routes/routes";
import { routeTitles } from "@/utils/routes/routeTitles";

interface FormData {
    gender: string;
    legal_status: string;
    workplace_insee_code: string;
    tjm: number;
    secondary_email: string;
    osm_city: string;
    average_nb_of_days: number;
}

export interface InfoUpdateProps {
    title: string;
    currentUserId: string;
    errors: string[];
    messages: string[];
    activeTab: string;
    formData: FormData;
    statusOptions: Option[];
    genderOptions: Option[];
    formValidationErrors: any;
    communeInfo: CommuneInfo | null;
    startups: string[];
    startupOptions: Option[];
    isAdmin: boolean;
    username: string;
}

/* Pure component */
export const InfoUpdate = (props: InfoUpdateProps) => {
    const [state, setState] = React.useState<any>({
        selectedName: "",
        ...props,
    });
    const [isSaving, setIsSaving] = React.useState<boolean>(false);
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>(
        {}
    );
    const [alertMessage, setAlertMessage] = React.useState<{
        message: string;
        type: "success" | "warning";
    }>();
    const [errorMessage, setErrorMessage] = React.useState<string>();

    const changeFormData = (key, value) => {
        const formData = state.formData;
        formData[key] = value;
        setState({
            ...state,
            formData,
        });
    };

    const handleGenderChange = (e) => {
        changeFormData("gender", e.currentTarget.value);
    };

    const handleLegalStatusChange = (e) => {
        changeFormData("legal_status", e.currentTarget.value);
    };

    const handleTJMChange = (e) => {
        changeFormData("tjm", e.currentTarget.value);
    };

    const handleCitySelect = (newValue) => {
        if (newValue.isOSM) {
            changeFormData("osm_city", JSON.stringify(newValue));
            changeFormData("workplace_insee_code", "");
        } else {
            changeFormData("workplace_insee_code", newValue.value);
            changeFormData("osm_city", "");
        }
    };

    const getDefaultValue = () => {
        if (props.formData.workplace_insee_code) {
            return props.communeInfo
                ? `${props.communeInfo.nom}  (${
                      (props.communeInfo.codesPostaux as string[])[0]
                  })`
                : null;
        } else if (state.formData.osm_city) {
            return JSON.parse(props.formData.osm_city).label;
        }
        return "";
    };

    const save = (event: { preventDefault: () => void }) => {
        event.preventDefault();
        if (isSaving) {
            return;
        }
        setIsSaving(true);
        axios
            .post(
                computeRoute(routes.ACCOUNT_POST_DETAIL_INFO_FORM).replace(
                    ":username",
                    props.username
                ),
                {
                    ...state.formData,
                },
                {
                    withCredentials: true,
                }
            )
            .then(() => {
                setIsSaving(false);
                setAlertMessage({
                    message: "Les informations ont bien été enregistrées.",
                    type: "success",
                });
            })
            .catch(
                ({
                    response: { data },
                }: {
                    response: { data: FormErrorResponse };
                }) => {
                    setIsSaving(false);
                    const ErrorResponse: FormErrorResponse = data;
                    setAlertMessage({
                        message: ErrorResponse.message,
                        type: "warning",
                    });
                    if (ErrorResponse.errors) {
                        setFormErrors(ErrorResponse.errors);
                    }
                }
            );
    };

    return (
        <>
            <div>
                <h1>{routeTitles.accountEditPrivateInfo()}</h1>
                {!!alertMessage && (
                    <Alert
                        className="fr-mb-8v"
                        severity={alertMessage.type}
                        closable={false}
                        title={alertMessage.message}
                    />
                )}
                <form onSubmit={save} method="POST">
                    <h4>Participez à notre observatoire statistique </h4>
                    ⚠️ Ces valeurs servent à alimenter l'
                    <a
                        href="https://metabase.incubateur.net/public/dashboard/554ff353-6104-4c25-a261-d8bdc40f75d5"
                        target="_blank"
                    >
                        observatoire de la communauté
                    </a>
                    . Elles sont confidentielles et anonymisées mis à part le
                    lieu de travail.<br></br>
                    <Select
                        label="Genre :"
                        hint="Cette information est utilisée uniquement pour
                            faire des statistiques. Elle n'est pas affichée."
                        nativeSelectProps={{
                            name: "gender",
                            value: state.formData.gender,
                            onChange: handleGenderChange,
                            required: true,
                        }}
                        state={formErrors["gender"] ? "error" : "default"}
                        stateRelatedMessage={formErrors["gender"]}
                    >
                        {props.genderOptions.map((gender) => {
                            return (
                                <option key={gender.key} value={gender.key}>
                                    {gender.name}
                                </option>
                            );
                        })}
                    </Select>
                    <RadioButtons
                        legend="Statut legal de ton entreprise (obligatoire) :"
                        options={props.statusOptions.map((legal_status) => ({
                            label: legal_status.name,
                            nativeInputProps: {
                                type: "radio",
                                name: "legal_status",
                                value: legal_status.key,
                                onChange: handleLegalStatusChange,
                                checked:
                                    legal_status.key ===
                                    state.formData.legal_status,
                                required: true,
                            },
                        }))}
                        state={formErrors["legal_status"] ? "error" : "default"}
                        stateRelatedMessage={formErrors["legal_status"]}
                    />
                    <Input
                        label="TJM moyen HT (si tu es indépendant) :"
                        hintText="Cette information est utilisée uniquement pour
                                    faire des statistiques. Elle n'est pas affichée."
                        nativeInputProps={{
                            onChange: handleTJMChange,
                            defaultValue: state.formData.tjm || 0,
                            type: "number",
                            placeholder: "TJM moyen ht en euros",
                        }}
                    />
                    <h4>Participe à la carte des membres (non anonyme)</h4>
                    <CitySelect
                        defaultValue={getDefaultValue()}
                        onChange={handleCitySelect}
                        placeholder={"Commune ou code postal"}
                        state={
                            formErrors["workplace_insee_code"]
                                ? "error"
                                : "default"
                        }
                        stateRelatedMessage={formErrors["workplace_insee_code"]}
                    />
                    <Button
                        nativeButtonProps={{
                            type: "submit",
                            disabled: isSaving,
                            onClick: save,
                        }}
                        children={
                            isSaving
                                ? `Enregistrement en cours...`
                                : `Enregistrer`
                        }
                    />
                </form>
            </div>
        </>
    );
};
