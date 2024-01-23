import React from "react";
import {
    AccessibilityStatus,
    PHASES_ORDERED_LIST,
    StartupInfo,
    StartupPhase,
} from "@/models/startup";
import { ClientOnly } from "../ClientOnly";
import MdEditor from "react-markdown-editor-lite";
import MarkdownIt from "markdown-it";
import SEAsyncIncubateurSelect from "../SEAsyncIncubateurSelect";
import SponsorBlock from "./SponsorBlock";
import {
    PhaseActionCell,
    PhaseDatePickerCell,
    PhaseSelectionCell,
} from "./PhaseItem";
import FileUpload from "../FileUpload";
import "react-markdown-editor-lite/lib/index.css";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import Table from "@codegouvfr/react-dsfr/Table";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import SelectAccessibilityStatus from "../SelectAccessibilityStatus";

// import style manually
const mdParser = new MarkdownIt(/* Markdown-it options */);

const DEFAULT_CONTENT = `Pour t'aider dans la rédaction de ta fiche produit, nous te recommandons de suivre ce plan: 

## Contexte

Quel est le contexte de ta Startup d'Etat ?

## Problème

Les problèmes que vous avez identifiés ou vos hypothèses de problèmes? Qui en souffre ? quels sont les conséquences de ces problèmes ?

## Solution

Décrit ta solution en quelques lignes? qui seront/sont les bénéficiaires ?

## Stratégie

Comment vous vous y prenez pour atteindre votre usagers ? quel impact chiffré visez-vous ?
`;

interface StartupForm {
    sponsors?: string[];
    incubator?: string;
    mission?: string;
    stats_url?: string;
    link?: string;
    dashlord_url?: string;
    analyse_risques_url?: string;
    analyse_risques?: boolean;
    repository?: string;
    content: string;
    accessibility_status?: any;
    save: any;
    contact?: string;
    phases?: {
        start: string;
        end?: string;
        name: StartupPhase;
    }[];
    startup?: StartupInfo;
}

interface FormErrorResponse {
    errors?: Record<string, string[]>;
    message: string;
}

const blobToBase64 = async (blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    return new Promise((resolve) => {
        reader.onloadend = () => {
            resolve(reader.result);
        };
    });
};

/* Pure component */
export const StartupForm = (props: StartupForm) => {
    const [text, setText] = React.useState(
        decodeURIComponent(props.content) || ""
    );
    const [title, setTitle] = React.useState<string | undefined>(
        props.startup?.attributes.name
    );
    const [alertMessage, setAlertMessage] = React.useState<{
        title: string;
        message: NonNullable<React.ReactNode>;
        type: "success" | "warning";
    }>();
    const [link, setLink] = React.useState<string | undefined>(props.link);
    const [repository, setRepository] = React.useState<string | undefined>(
        props.repository
    );
    const [mission, setMission] = React.useState(props.mission);
    const [sponsors, setSponsors] = React.useState(props.sponsors || []);
    const [newSponsors, setNewSponsors] = React.useState([]);
    const [contact, setContact] = React.useState(props.contact);

    const [incubator, setIncubator] = React.useState(props.incubator);
    const [stats_url, setStatsUrl] = React.useState<string | undefined>(
        props.stats_url
    );
    const [analyse_risques_url, setAnalyseRisquesUrl] = React.useState<
        string | undefined
    >(props.analyse_risques_url);
    const [analyse_risques, setAnalyseRisques] = React.useState<
        boolean | undefined
    >(props.analyse_risques || undefined);
    const [dashlord_url, setDashlord] = React.useState<string | undefined>(
        props.dashlord_url
    );
    const [accessibility_status, setAccessibilityStatus] = React.useState(
        props.accessibility_status || AccessibilityStatus.NON_CONFORME
    );
    const [selectedFile, setSelectedFile]: [undefined | File, (File) => void] =
        React.useState();
    const [phases, setPhases] = React.useState(
        props.phases || [
            {
                name: StartupPhase.PHASE_INVESTIGATION,
                start: "",
            },
        ]
    );
    const [errorMessage, setErrorMessage] = React.useState("");
    const [formErrors, setFormErrors] = React.useState({});
    const [isSaving, setIsSaving] = React.useState(false);

    const save = async (event) => {
        event.preventDefault();
        if (isSaving) {
            return;
        }
        setIsSaving(true);
        let data = {
            phases,
            text,
            link,
            dashlord_url,
            mission,
            title,
            incubator,
            newSponsors: newSponsors,
            sponsors: sponsors,
            stats_url,
            repository,
            image: "",
            contact,
            analyse_risques,
            analyse_risques_url,
            accessibility_status,
        };
        if (selectedFile) {
            const imageAsBase64 = await blobToBase64(selectedFile);
            data = {
                ...data,
                image: imageAsBase64 as string,
            };
        }
        props
            .save(data)
            .then((resp) => {
                setIsSaving(false);
                setAlertMessage({
                    title: `⚠️ Pull request pour ${
                        resp.isUpdate ? "la mise à jour" : "la création"
                    } de la fiche produit ouverte.`,
                    message: (
                        <>
                            Tu peux merger cette pull request :
                            <a href={resp.data.pr_url} target="_blank">
                                {resp.data.pr_url}
                            </a>
                            <br />
                            Une fois mergée,{" "}
                            {resp.isUpdate
                                ? `les changements apparaitront`
                                : `la fiche apparaitra`}{" "}
                            sur le site beta.
                        </>
                    ),
                    type: "success",
                });
                return resp;
            })
            .catch((e) => {
                console.error(e);
                setIsSaving(false);
                const ErrorResponse: FormErrorResponse = e.response
                    .data as FormErrorResponse;
                setAlertMessage({
                    title: "Une erreur est pas survenue",
                    message: <>{ErrorResponse.message}</>,
                    type: "warning",
                });
                setIsSaving(false);
                if (ErrorResponse.errors) {
                    setFormErrors(ErrorResponse.errors);
                }
            });
    };

    function addPhase() {
        let nextPhase = StartupPhase.PHASE_INVESTIGATION;
        let nextDate = new Date().toISOString().split("T")[0];
        if (phases.length) {
            const previousPhase: StartupPhase = phases[phases.length - 1].name;
            const previousPhaseIndex = PHASES_ORDERED_LIST.findIndex(
                (value) => value === previousPhase
            );
            nextDate =
                phases[phases.length - 1].end ||
                new Date().toISOString().split("T")[0];
            nextPhase = PHASES_ORDERED_LIST[previousPhaseIndex + 1];
        }

        setPhases([...phases, { start: nextDate, name: nextPhase }]);
    }

    function deletePhase(index: number) {
        const newPhases = [...phases];
        newPhases.splice(index, 1);
        setPhases([...newPhases]);
    }

    function changePhase(index: number, phase: StartupPhase) {
        const newPhases = [...phases];
        newPhases[index].name = phase;
        setPhases([...newPhases]);
    }

    function changePhaseDate(index: number, date: string) {
        const newPhases = [...phases];
        newPhases[index].start = date;
        setPhases([...newPhases]);
    }

    function handleEditorChange({ html, text }) {
        setText(text);
    }

    function hasChanged() {
        return (
            !!props.startup &&
            (!phases ||
                JSON.stringify(phases) === JSON.stringify(props.phases)) &&
            title === props.startup?.attributes.name &&
            (!text || text === decodeURIComponent(props.content)) &&
            link === props.link &&
            dashlord_url === props.dashlord_url &&
            stats_url === props.stats_url &&
            mission === props.mission &&
            contact === props.contact &&
            analyse_risques === props.analyse_risques &&
            analyse_risques_url === props.analyse_risques_url &&
            accessibility_status === props.accessibility_status &&
            repository === props.repository &&
            incubator === props.incubator &&
            !selectedFile &&
            JSON.stringify(sponsors) === JSON.stringify(props.sponsors)
        );
    }
    let disabled = false;

    if (hasChanged()) {
        disabled = true;
    }
    return (
        <>
            <div>
                {!!alertMessage && (
                    <Alert
                        className="fr-mb-8v"
                        severity={alertMessage.type}
                        closable={false}
                        title={alertMessage.title}
                        description={alertMessage.message}
                    />
                )}
                {
                    <>
                        <form onSubmit={save}>
                            <Input
                                label="Nom du produit"
                                hintText={`Ce nom sert d'identifiant pour la startup et
                                ne doit pas dépasser 30 caractères.`}
                                stateRelatedMessage={
                                    formErrors && formErrors["startup"]
                                }
                                state={
                                    !!(formErrors && formErrors["startup"])
                                        ? "error"
                                        : "default"
                                }
                                nativeInputProps={{
                                    onChange: (e) => {
                                        setTitle(
                                            e.currentTarget.value || undefined
                                        );
                                    },
                                    defaultValue: title,
                                    required: true,
                                }}
                            />
                            <Input
                                label="Quel est son objectif principal ?"
                                hintText={`Par exemple : "Faciliter la création d'une
                                    fiche produit". Pas besoin de faire plus
                                    long.`}
                                textArea={true}
                                nativeTextAreaProps={{
                                    onChange: (e) => {
                                        setMission(
                                            e.currentTarget.value || undefined
                                        );
                                    },
                                    value: mission,
                                    required: true,
                                }}
                                stateRelatedMessage={
                                    formErrors && formErrors["mission"]
                                }
                                state={
                                    !!(formErrors && formErrors["mission"])
                                        ? "error"
                                        : "default"
                                }
                            />

                            <div
                                className={`fr-input-group ${
                                    formErrors["description du produit"]
                                        ? "fr-input-group--error"
                                        : ""
                                }`}
                            >
                                <label className="fr-label">
                                    Description du produit :
                                    <span className="fr-hint-text">
                                        Décrivez votre produit
                                    </span>
                                </label>
                                <ClientOnly>
                                    <MdEditor
                                        defaultValue={decodeURIComponent(
                                            props.content || DEFAULT_CONTENT
                                        )}
                                        style={{
                                            height: "500px",
                                            marginTop: "0.5rem",
                                        }}
                                        renderHTML={(text) =>
                                            mdParser.render(text)
                                        }
                                        onChange={handleEditorChange}
                                    />
                                </ClientOnly>
                                {!!formErrors["description du produit"] && (
                                    <p
                                        id="text-input-error-desc-error"
                                        className="fr-error-text"
                                    >
                                        {formErrors["description du produit"]}
                                    </p>
                                )}
                            </div>
                            <SEAsyncIncubateurSelect
                                value={incubator}
                                onChange={(e) => {
                                    setIncubator(e.value || undefined);
                                }}
                                required={true}
                            />
                            <SponsorBlock
                                newSponsors={newSponsors}
                                setNewSponsors={setNewSponsors}
                                sponsors={sponsors}
                                setSponsors={(sponsors) =>
                                    setSponsors(sponsors)
                                }
                            />
                            <div
                                className={`fr-input-group ${
                                    formErrors["phases"] || formErrors["date"]
                                        ? "fr-input-group--error"
                                        : ""
                                }`}
                            >
                                <label className="fr-label">
                                    Phase
                                    <span className="fr-hint-text">
                                        Voici l'historique des phases dans
                                        lesquelles a été ce produit.
                                    </span>
                                </label>
                                <Table
                                    style={{ marginBottom: "0.5rem" }}
                                    data={phases.map((phase, index) => {
                                        return [
                                            <PhaseSelectionCell
                                                name={phase.name}
                                                index={index}
                                                changePhase={changePhase}
                                                key={index}
                                            />,
                                            <PhaseDatePickerCell
                                                start={phase.start}
                                                name={phase.name}
                                                index={index}
                                                changePhaseDate={
                                                    changePhaseDate
                                                }
                                                key={index}
                                            />,
                                            <PhaseActionCell
                                                index={index}
                                                deletePhase={deletePhase}
                                                key={index}
                                            />,
                                        ];
                                    })}
                                    headers={[
                                        "Phase",
                                        "Date de début",
                                        "Action",
                                    ]}
                                />
                                <span className="fr-text fr-text--sm">
                                    Il manque une phase ?
                                </span>
                                <Button
                                    children={`Ajouter une phase`}
                                    nativeButtonProps={{
                                        onClick: (
                                            e: React.MouseEvent<HTMLButtonElement>
                                        ): void => {
                                            e.preventDefault();
                                            addPhase();
                                        },
                                    }}
                                    style={{
                                        marginLeft: `0.5rem`,
                                        transform: `translateY(0.25rem)`,
                                    }}
                                    iconId="fr-icon-add-circle-fill"
                                    size="small"
                                    priority="tertiary no outline"
                                />
                                {!!formErrors["phases"] && (
                                    <p
                                        id="text-input-error-desc-error"
                                        className="fr-error-text"
                                    >
                                        {formErrors["phases"]}
                                    </p>
                                )}
                                {!!formErrors["date"] && (
                                    <p
                                        id="text-input-error-desc-error"
                                        className="fr-error-text"
                                    >
                                        Une des dates n'est pas valide
                                    </p>
                                )}
                            </div>
                            <FileUpload
                                selectedFile={selectedFile}
                                setSelectedFile={setSelectedFile}
                            />
                            <Input
                                label="URL du site"
                                nativeInputProps={{
                                    onChange: (e) => {
                                        setLink(
                                            e.currentTarget.value || undefined
                                        );
                                    },
                                    value: link,
                                }}
                            />
                            <Input
                                label="Lien du repository github"
                                nativeInputProps={{
                                    name: "Lien du repository github",
                                    onChange: (e) => {
                                        setRepository(
                                            e.currentTarget.value || undefined
                                        );
                                    },
                                    value: repository,
                                }}
                            />
                            <Input
                                label="Lien du dashlord"
                                nativeInputProps={{
                                    name: "dashlord",
                                    onChange: (e) => {
                                        setDashlord(
                                            e.currentTarget.value || undefined
                                        );
                                    },
                                    value: dashlord_url,
                                }}
                            />
                            <Input
                                label="Contact"
                                nativeInputProps={{
                                    onChange: (e) => {
                                        setContact(
                                            e.currentTarget.value || undefined
                                        );
                                    },
                                    value: contact,
                                    required: true,
                                }}
                            />
                            <SelectAccessibilityStatus
                                value={accessibility_status}
                                onChange={(e) =>
                                    setAccessibilityStatus(
                                        e.currentTarget.value || undefined
                                    )
                                }
                            />
                            <RadioButtons
                                legend="Indique si ta startup à déjà réalisé un atelier d'analyse de risque agile."
                                options={[
                                    {
                                        label: "Oui",
                                        nativeInputProps: {
                                            defaultChecked:
                                                analyse_risques === true,
                                            checked: analyse_risques === true,
                                            onChange: () =>
                                                setAnalyseRisques(true),
                                        },
                                    },
                                    {
                                        label: "Non",
                                        nativeInputProps: {
                                            defaultChecked:
                                                analyse_risques === false ||
                                                !analyse_risques,
                                            checked:
                                                analyse_risques === false ||
                                                !analyse_risques,
                                            onChange: () =>
                                                setAnalyseRisques(false),
                                        },
                                    },
                                ]}
                            />
                            <Input
                                label="Url de l'analyse de risque"
                                hintText="Si vous avez rendu une analyse de risques publique, tu peux indiquer le lien vers ce document ici."
                                nativeInputProps={{
                                    onChange: (e) => {
                                        setAnalyseRisquesUrl(
                                            e.currentTarget.value || undefined
                                        );
                                    },
                                    defaultValue: analyse_risques_url,
                                }}
                            />
                            <Input
                                label="Lien de la page stats"
                                nativeInputProps={{
                                    name: "stats_url",
                                    onChange: (e) => {
                                        setStatsUrl(
                                            e.currentTarget.value || undefined
                                        );
                                    },
                                    value: stats_url,
                                }}
                            />
                            <Button
                                nativeButtonProps={{
                                    type: "submit",
                                    disabled: isSaving || disabled,
                                }}
                                children={
                                    isSaving
                                        ? `Enregistrement en cours...`
                                        : `Enregistrer`
                                }
                            />
                        </form>
                    </>
                }
            </div>
        </>
    );
};
