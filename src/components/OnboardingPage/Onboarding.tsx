"use client";
import React from "react";
import _ from "lodash";
import axios from "axios";

import CitySelect from "../CitySelect";
import { Member } from "@/models/member";
import { StartupInfo } from "@/models/startup";
import MemberSelect from "../MemberSelect";
import SESelect from "../SESelect";
import CommunicationEmailSelect from "../CommunicationEmailSelect";
import routes, { computeRoute } from "@/routes/routes";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import ModalOnboarding from "./ModalOnboarding";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { FormErrorResponse } from "@/models/misc";
import { createUsername } from "@/utils/github";

const modal = createModal({
    id: "foo-modal",
    isOpenedByDefault: false,
});

function formatDateToReadableFormat(date) {
    let day = date.getDate().toString();
    day = day.length === 1 ? `0${day}` : day;
    let month = (date.getMonth() + 1).toString();
    month = month.length === 1 ? `0${month}` : month;
    return `${date.getFullYear()}-${month}-${day}`;
}

interface CommuneInfo {
    nom: string;
    codesPostaux?: string[];
}

interface Option {
    key: string;
    name: string;
}

interface FormData {
    gender: string;
    legal_status: string;
    workplace_insee_code: string;
    tjm: number;
    secondary_email: string;
    osm_city: string;
    firstName?: string;
    lastName?: string;
    start?: string;
    end?: string;
    average_nb_of_days?: number;
    communication_email: "primary" | "secondary";
    should_create_marrainage: boolean;
    memberType: string;
}

export interface OnboardingProps {
    title?: string;
    errors?: string[];
    messages?: string[];
    formData: FormData;
    users: Member[];
    allUsers: Member[];
    domaineOptions: Option[];
    statusOptions: Option[];
    genderOptions: Option[];
    communeInfo: CommuneInfo;
    startups: StartupInfo[];
    startupOptions: {
        value: string;
        label: string;
    }[];
    userConfig: {
        statusOptions: Option[];
        minStartDate: string;
        badgeOptions: Option[];
        memberOptions: Option[];
    };
}

/* Pure component */
export const Onboarding = function (props: OnboardingProps) {
    const [state, setState] = React.useState<any>({
        selectedName: "",
        ...props,
        formData: {
            ...props.formData,
            communication_email: "primary",
            firstName: props.formData.firstName || "",
            lastName: props.formData.lastName || "",
            start: props.formData.start ? new Date(props.formData.start) : "",
            end: props.formData.end ? new Date(props.formData.end) : "",
        },
    });

    const [isSaving, setIsSaving] = React.useState<boolean>(false);
    const [errorMessage, setErrorMessage] = React.useState<
        string | undefined
    >();
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>(
        {}
    );

    function openModal() {
        modal.open();
    }

    React.useEffect(() => {
        checkUserExists();
    }, [state.formData.firstName, state.formData.lastName]);

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

    const handleDomaineChange = (e) => {
        changeFormData("domaine", e.currentTarget.value);
    };

    const handleLegalStatusChange = (e) => {
        changeFormData("legal_status", e.currentTarget.value);
    };

    const handleStatusChange = (e) => {
        changeFormData("status", e.currentTarget.value);
    };

    const handleTJMChange = (e) => {
        changeFormData("tjm", e.currentTarget.value);
    };

    const handleEmail = (e) => {
        changeFormData("email", e.currentTarget.value);
    };

    const handleMemberTypeChange = (e) => {
        changeFormData("memberType", e.currentTarget.value);
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

    const checkUserExists = React.useMemo(
        () =>
            _.debounce(() => {
                const username: string = createUsername(
                    state.formData.firstName,
                    state.formData.lastName
                );
                const userExists: Member | undefined = props.allUsers.find(
                    (user) => user.id === username
                );
                if (userExists) {
                    openModal();
                }
            }, 500),
        []
    );

    const getDefaultValue = () => {
        if (props.formData.workplace_insee_code) {
            return props.communeInfo
                ? `${props.communeInfo.nom}  (${
                      (props.communeInfo.codesPostaux as string[])[0]
                  })`
                : null;
        } else if (state.formData.osm_city) {
            return JSON.parse(state.formData.osm_city).label;
        }
        return "";
    };

    const formatDate = (date: Date) => {
        return formatDateToReadableFormat(date);
    };

    const save = async (e) => {
        e.preventDefault();
        if (isSaving) {
            return;
        }
        setIsSaving(true);
        axios
            .post(computeRoute(routes.ONBOARDING_ACTION_API), {
                ...state.formData,
            })
            .then(({ data }) => {
                window.location.replace(
                    `/onboardingSuccess/${data.prInfoNumber}?isEmailBetaAsked=${data.isEmailBetaAsked}`
                );
                setIsSaving(false);
            })
            .catch(
                ({
                    response: { data },
                }: {
                    response: { data: FormErrorResponse };
                }) => {
                    setIsSaving(false);
                    const ErrorResponse: FormErrorResponse = data;
                    setErrorMessage(ErrorResponse.message);
                    if (ErrorResponse.errors) {
                        setFormErrors(ErrorResponse.errors);
                    }
                }
            );
    };

    const previewEmail: string = createUsername(
        state.formData.firstName,
        state.formData.lastName
    );
    return (
        <div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
            <div className="fr-container fr-background-alt--grey fr-px-md-0 fr-py-10v fr-py-md-14v">
                <div className="fr-grid-row fr-grid-row-gutters fr-grid-row--center">
                    <div className="fr-col-12 fr-col-md-10 fr-col-lg-10">
                        <div className="fr-mb-6v">
                            {!!errorMessage && (
                                <Alert
                                    closable
                                    description={errorMessage}
                                    severity="error"
                                    title="Le formulaire a renvoyer une erreur"
                                />
                            )}
                            {!!formErrors["utilisateur existant"] && (
                                <Alert
                                    closable
                                    description={
                                        formErrors["utilisateur existant"]
                                    }
                                    severity="error"
                                    title="Le formulaire a renvoyer une erreur"
                                />
                            )}
                            <modal.Component title="Attention un utilisateur existe déjà">
                                <ModalOnboarding
                                    firstName={state.formData.firstName}
                                />
                            </modal.Component>
                            <h3>Créer ma fiche Github</h3>
                            <form onSubmit={save}>
                                <h4>Tes infos persos</h4>
                                <div className="form__group">
                                    <p>
                                        Tes informations personnelles seront
                                        affichées sur la page{" "}
                                        <a
                                            href="https://beta.gouv.fr/communaute/"
                                            target="_blank"
                                        >
                                            Communauté
                                        </a>{" "}
                                        du site BetaGouv, ainsi que dans la
                                        fiche de ta startup.
                                    </p>
                                    <Input
                                        label="Prénom (obligatoire)"
                                        nativeInputProps={{
                                            name: "firstName",
                                            defaultValue:
                                                state.formData.firstName,
                                            onChange: (e) => {
                                                changeFormData(
                                                    "firstName",
                                                    e.currentTarget.value
                                                );
                                            },
                                            required: true,
                                        }}
                                    />
                                    <Input
                                        label="Nom de famille (obligatoire)"
                                        nativeInputProps={{
                                            name: "lastName",
                                            defaultValue:
                                                state.formData.lastName,
                                            onChange: (e) => {
                                                changeFormData(
                                                    "lastName",
                                                    e.currentTarget.value
                                                );
                                            },
                                            required: true,
                                        }}
                                    />
                                    <Alert
                                        description={
                                            <>
                                                Ton email sera :{" "}
                                                {previewEmail || "prenom.nom"}
                                                @beta.gouv.fr
                                            </>
                                        }
                                        className="fr-mb-2w"
                                        severity="info"
                                        small
                                    />
                                </div>
                                <Input
                                    label="Courte bio"
                                    hintText={
                                        <>
                                            Cette phrase d'accroche sera
                                            affichée sur{" "}
                                            <a href="https://beta.gouv.fr/communaute/annuaire">
                                                l'annuaire
                                            </a>
                                            .<br />
                                            <i>
                                                Exemple : « Développeur le jour,
                                                musicien la nuit. »
                                            </i>
                                        </>
                                    }
                                    textArea={true}
                                    nativeTextAreaProps={{
                                        rows: 2,
                                        name: "description",
                                        defaultValue:
                                            state.formData.description,
                                    }}
                                />
                                <Input
                                    label="Site personnel"
                                    hintText={
                                        <>
                                            Commençant avec <em>http://</em> ou{" "}
                                            <em>https://</em>
                                        </>
                                    }
                                    nativeInputProps={{
                                        name: "website",
                                        defaultValue: state.formData.website,
                                        onChange: (e) => {
                                            changeFormData(
                                                "website",
                                                e.currentTarget.value
                                            );
                                        },
                                        pattern: "^(http|https)://.+",
                                        title: "Doit commencer par http:// ou https://",
                                    }}
                                />
                                <Input
                                    label="Nom d'utilisateur Github si tu as un compte (sans @)"
                                    hintText="Si tu ne sais pas ce qu'est Github, laisse ce
                            champ vide."
                                    nativeInputProps={{
                                        name: "github",
                                        pattern:
                                            "^[A-zd](?:[A-zd]|-(?=[A-zd])){0,38}$",
                                        value: state.formData.github,
                                        onChange: (e) => {
                                            changeFormData(
                                                "github",
                                                e.currentTarget.value
                                            );
                                        },
                                        title: "Nom d'utilisateur Github si tu as un compte (sans @)",
                                    }}
                                />
                                <Select
                                    label="Genre"
                                    hint="Cette information est utilisée uniquement pour
                            faire des statistiques. Elle n'est pas affichée."
                                    nativeSelectProps={{
                                        name: "gender",
                                        value: state.formData.gender,
                                        onChange: handleGenderChange,
                                        placeholder: "Sélectionne une valeur",
                                        required: true,
                                    }}
                                    state={
                                        formErrors["gender"]
                                            ? "error"
                                            : "default"
                                    }
                                    stateRelatedMessage={formErrors["gender"]}
                                >
                                    {props.genderOptions.map((gender) => {
                                        return (
                                            <option
                                                key={gender.key}
                                                value={gender.key}
                                            >
                                                {gender.name}
                                            </option>
                                        );
                                    })}
                                </Select>
                                <CitySelect
                                    defaultValue={getDefaultValue()}
                                    onChange={handleCitySelect}
                                    placeholder={"Commune ou code postal"}
                                    state={
                                        formErrors["workplace_insee_code"]
                                            ? "error"
                                            : "default"
                                    }
                                    stateRelatedMessage={
                                        formErrors["workplace_insee_code"]
                                    }
                                />
                                <h4>Ta mission</h4>
                                <Select
                                    label="Domaine (obligatoire)"
                                    hint="Quel est le domaine de ta mission ?"
                                    nativeSelectProps={{
                                        name: "domaine",
                                        value: state.formData.domaine,
                                        onChange: handleDomaineChange,
                                        placeholder: "Sélectionne une valeur",
                                        required: true,
                                    }}
                                    state={
                                        formErrors["domaine"]
                                            ? "error"
                                            : "default"
                                    }
                                    stateRelatedMessage={formErrors["domaine"]}
                                >
                                    <option value="" selected disabled hidden>
                                        Selectionnez un domaine
                                    </option>
                                    {props.domaineOptions.map((domaine) => {
                                        return (
                                            <option
                                                key={domaine.key}
                                                value={domaine.name}
                                            >
                                                {domaine.name}
                                            </option>
                                        );
                                    })}
                                </Select>
                                <Input
                                    label="Rôle chez BetaGouv (obligatoire)"
                                    hintText="Quel est ton titre de poste ? Développeuse,
                                Intrapreneur, Chargée de déploiement, Coach, UX
                                Designer..."
                                    nativeInputProps={{
                                        name: "role",
                                        onChange: (e) => {
                                            changeFormData(
                                                "role",
                                                e.currentTarget.value
                                            );
                                        },
                                        value: state.formData.role,
                                        required: true,
                                    }}
                                />
                                <Input
                                    label="Début de la mission (obligatoire)"
                                    hintText="Au format JJ/MM/YYYY"
                                    nativeInputProps={{
                                        type: "date",
                                        required: true,
                                        name: "startDate",
                                        min: props.userConfig.minStartDate,
                                        title: "En format YYYY-MM-DD, par exemple : 2020-01-31",
                                        onChange: (e) =>
                                            changeFormData(
                                                "start",
                                                e.target.value
                                            ),
                                    }}
                                    state={
                                        formErrors["début de la mission"] ||
                                        formErrors["date de début"]
                                            ? "error"
                                            : "default"
                                    }
                                    stateRelatedMessage={[
                                        formErrors["début de la mission"],
                                        formErrors["date de début"],
                                    ]
                                        .filter((m) => m)
                                        .join(",")}
                                />
                                <Input
                                    label="Fin de la mission (obligatoire)"
                                    hintText={
                                        <>
                                            Si tu ne la connais pas, mets une
                                            date dans 3 mois, tu pourras la
                                            corriger plus tard.
                                            <br />
                                            <i>Au format JJ/MM/YYYY</i>
                                        </>
                                    }
                                    nativeInputProps={{
                                        type: "date",
                                        required: true,
                                        name: "startDate",
                                        min: props.userConfig.minStartDate,
                                        title: "En format YYYY-MM-DD, par exemple : 2020-01-31",
                                        onChange: (e) =>
                                            changeFormData(
                                                "end",
                                                e.target.value
                                            ),
                                    }}
                                    state={
                                        formErrors["dfin de la mission"] ||
                                        formErrors["date de fin"]
                                            ? "error"
                                            : "default"
                                    }
                                    stateRelatedMessage={[
                                        formErrors["fin de la mission"],
                                        formErrors["date de fin"],
                                    ]
                                        .filter((m) => m)
                                        .join(",")}
                                />
                                <Input
                                    label="Nombre de jours moyen travaillés par semaine"
                                    hintText="Tu pourras changer plus tard"
                                    nativeInputProps={{
                                        defaultValue:
                                            state.formData.average_nb_of_days ||
                                            0,
                                        id: "averageNbOfDays",
                                        name: "average_nb_of_days",
                                        type: "number",
                                        step: "0.5",
                                        placeholder: "Nombre de jours moyen",
                                        min: 0,
                                        max: 5,
                                    }}
                                />
                                <RadioButtons
                                    legend="Statut (obligatoire)"
                                    options={props.userConfig.statusOptions.map(
                                        (status) => ({
                                            label: status.name,
                                            nativeInputProps: {
                                                checked:
                                                    status.key ===
                                                    state.formData.status,
                                                onChange: handleStatusChange,
                                                required: true,
                                                value: status.key,
                                            },
                                        })
                                    )}
                                    state={
                                        formErrors["status"]
                                            ? "error"
                                            : "default"
                                    }
                                    stateRelatedMessage={formErrors["status"]}
                                />
                                <RadioButtons
                                    legend="Statut legal de ton entreprise (obligatoire)"
                                    options={props.statusOptions.map(
                                        (legal_status) => ({
                                            label: legal_status.name,
                                            nativeInputProps: {
                                                type: "radio",
                                                name: "legal_status",
                                                value: legal_status.key,
                                                onChange:
                                                    handleLegalStatusChange,
                                                checked:
                                                    legal_status.key ===
                                                    state.formData.legal_status,
                                                required: true,
                                            },
                                        })
                                    )}
                                    state={
                                        formErrors["legal_status"]
                                            ? "error"
                                            : "default"
                                    }
                                    stateRelatedMessage={
                                        formErrors["legal_status"]
                                    }
                                />
                                <Input
                                    label="TJM moyen HT (si tu es indépendant)"
                                    hintText="Cette information est utilisée uniquement pour
                                    faire des statistiques. Elle n'est pas affichée."
                                    nativeInputProps={{
                                        onChange: handleTJMChange,
                                        defaultValue: state.formData.tjm || 0,
                                        type: "number",
                                        placeholder: "TJM moyen ht en euros",
                                    }}
                                />
                                <MemberSelect
                                    label="Référent (obligatoire)"
                                    hint="Selectionne un membre l'équipe de co-animation
                                avec qui tu es en contact."
                                    onChange={(member) =>
                                        changeFormData(
                                            "referent",
                                            (member as { value: string }).value
                                        )
                                    }
                                    members={props.users.map((u) => ({
                                        value: u.id,
                                        label: u.fullname,
                                    }))}
                                    required={true}
                                    defaultValue={props.users
                                        .map((u) => ({
                                            value: u.id,
                                            label: u.fullname,
                                        }))
                                        .find(
                                            (d) =>
                                                d.value ===
                                                state.formData.referent
                                        )}
                                />
                                <SESelect
                                    label="Startup d'État"
                                    hint="Laisser vide si elle n'apparaît pas. Tu pourras
                                modifier ton profil plus tard."
                                    startups={props.startupOptions}
                                    onChange={(e) => {
                                        changeFormData("startup", e.value);
                                    }}
                                    isMulti={undefined}
                                    placeholder={"Sélectionne un produit"}
                                    defaultValue={props.startupOptions.find(
                                        (d) =>
                                            d.value === state.formData.startup
                                    )}
                                />
                                <Input
                                    label="Employeur"
                                    hintText="L'entité avec laquelle tu as signé ton contrat
                                (DINUM, Octo...)"
                                    nativeInputProps={{
                                        name: "employer",
                                        value: state.formData.employer,
                                        onChange: (e) =>
                                            changeFormData(
                                                "employer",
                                                e.currentTarget.value
                                            ),
                                    }}
                                />
                                <RadioButtons
                                    legend="Es-tu ?"
                                    options={props.userConfig.memberOptions.map(
                                        (memberType) => ({
                                            label: memberType.name,
                                            nativeInputProps: {
                                                checked:
                                                    memberType.key ===
                                                    state.formData.memberType,
                                                onChange:
                                                    handleMemberTypeChange,
                                                required: true,
                                                value: memberType.key,
                                            },
                                        })
                                    )}
                                />
                                <h4>Ton email</h4>
                                <Input
                                    label="Email pro (obligatoire)"
                                    hintText="Ton email nous servira pour t'envoyer les
                                informations relatives à ton compte"
                                    nativeInputProps={{
                                        onChange: handleEmail,
                                        value: state.formData.email,
                                        id: "email",
                                        name: "email",
                                        type: "email",
                                        placeholder: "un email de recupération",
                                        required: true,
                                    }}
                                    state={
                                        formErrors["email"] ||
                                        formErrors["utilisateur existant"]
                                            ? "error"
                                            : "default"
                                    }
                                    stateRelatedMessage={[
                                        formErrors["mail"],
                                        formErrors["utilisateur existant"],
                                    ]
                                        .filter((m) => m)
                                        .join(", ")}
                                />
                                <Checkbox
                                    hintText="L'adresse @beta.gouv.fr est obligatoire si
                                tu ne possédes pas déjà une adresse d'une
                                structure publique (@pole-emploi.fr,
                                @culture.gouv.fr...)"
                                    options={[
                                        {
                                            label: "Je souhaite une adresse @beta.gouv.fr",
                                            nativeInputProps: {
                                                name: "checkboxes-1",
                                                onChange: (e) =>
                                                    changeFormData(
                                                        "isEmailBetaAsked",
                                                        !state.formData
                                                            .isEmailBetaAsked
                                                    ),
                                                value: state.formData
                                                    .isEmailBetaAsked,
                                                checked:
                                                    !!state.formData
                                                        .isEmailBetaAsked,
                                            },
                                        },
                                    ]}
                                    state={
                                        formErrors["email public"]
                                            ? "error"
                                            : "default"
                                    }
                                    stateRelatedMessage={
                                        formErrors["email public"]
                                    }
                                />
                                {!!state.formData.isEmailBetaAsked && (
                                    <CommunicationEmailSelect
                                        label="Tes préférences de communication"
                                        hint="Sur quel email préfères-tu recevoir les
                                        communications beta.gouv.fr ? (Newsletter,
                                        Rappel de mise-à-jour de tes info, ...) Tu
                                        pourras changer ultérieurement."
                                        email={state.formData.email}
                                        defaultValue={
                                            state.formData.communication_email
                                        }
                                        onChange={(e) =>
                                            changeFormData(
                                                "communication_email",
                                                e.value
                                            )
                                        }
                                    />
                                )}
                                <Button
                                    nativeButtonProps={{
                                        type: "submit",
                                        disabled: isSaving,
                                    }}
                                    children={
                                        isSaving
                                            ? `Création de la fiche en cours...`
                                            : `Créer ma fiche`
                                    }
                                />
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
