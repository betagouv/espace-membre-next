"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

import { Member } from "@/models/member";
import routes, { computeRoute } from "@/routes/routes";
import { AdminMattermostUser } from "./AdminMattermostUser";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";

interface Option {
    value: string;
    label: string;
}

export interface AdminMattermostProps {
    title: string;
    currentUserId: string;
    errors: string[];
    messages: string[];
    users: Member[];
    activeTab: string;
    isAdmin: boolean;
    channelOptions: Option[];
}

const css = ".panel { min-height: 400px; }"; // to have enough space to display dropdown

/* Pure component */
export const AdminMattermost = (props: AdminMattermostProps) => {
    const [usersForMessage, setUsersForMessage] = useState([]);
    const [channel, setChannel] = useState("town-square");
    const [messageType, setMessageType] = useState("channel");
    const [includeEmails, setIncludeEmails] = useState("");
    const [excludeEmails, setExcludeEmails] = useState("");
    const [text, setText] = useState("");
    const [fromBeta, setFromBeta] = useState(true);

    useEffect(() => {
        updateQuery();
    }, [fromBeta, excludeEmails, includeEmails, messageType]);

    const onChangeFromBeta = async (e) => {
        setFromBeta(!fromBeta);
    };

    const onChangeExcludeEmail = async (e) => {
        setExcludeEmails(e.target.value);
    };

    const onChangeIncludeEmail = async (e) => {
        setIncludeEmails(e.target.value);
    };

    const handleMessageTypeChange = async (e) => {
        setMessageType(e.target.value);
    };

    const updateQuery = async () => {
        const params = {
            excludeEmails,
            includeEmails,
            fromBeta,
        };
        const queryParamsString = Object.keys(params)
            .map((key) => key + "=" + params[key])
            .join("&");
        try {
            const usersForMessage = await axios
                .get(
                    `${computeRoute(
                        routes.ADMIN_MATTERMOST_MESSAGE_API
                    )}?${queryParamsString}`
                )
                .then((resp) => resp.data.users);
            setUsersForMessage(usersForMessage);
        } catch (e) {}
    };

    const buildParams = (prod) => {
        return {
            fromBeta,
            prod,
            includeEmails,
            excludeEmails,
            text,
            channel: messageType === "channel" ? channel : undefined,
        };
    };

    const send = async () => {
        if (
            confirm(
                `Est-tu sur de vouloir envoyer cette email à ${
                    messageType === "channel"
                        ? "au canal " +
                          (
                              props.channelOptions.find(
                                  (c) => c.value === channel
                              ) as Option
                          ).label
                        : "à " + usersForMessage.length + " membres ?"
                }`
            ) === true
        ) {
            const res = await axios.post(
                computeRoute(routes.ADMIN_MATTERMOST_SEND_MESSAGE),
                buildParams(true),
                {
                    withCredentials: true,
                }
            );
            alert(`${res.data.message}`);
        } else {
            alert(`Le message n'a pas été envoyé`);
        }
    };
    const sendTest = async () => {
        try {
            const res = await axios.post(
                computeRoute(routes.ADMIN_MATTERMOST_SEND_MESSAGE),
                buildParams(false),
                {
                    withCredentials: true,
                }
            );
            alert(`${res.data.message}`);
            console.log("Done");
        } catch (e) {
            console.log("Erreur");
        }
    };
    const [value, setValue] = useState<"one" | "two" | "three" | undefined>(
        undefined
    );
    return (
        <>
            <div>
                <div key={"mattermost-message"}>
                    <h2>Envoyer un message aux utilisateurs mattermost</h2>
                    <div>
                        <RadioButtons
                            legend="Envoyer le message sur un canal ou en
                                message direct à chaque personne ?"
                            options={[
                                {
                                    label: "Sur un canal",
                                    nativeInputProps: {
                                        value: "channel",
                                        checked: messageType === "channel",
                                        onChange: handleMessageTypeChange,
                                    },
                                },
                                {
                                    label: "En message direct",
                                    nativeInputProps: {
                                        value: "DM",
                                        checked: messageType === "DM",
                                        onChange: handleMessageTypeChange,
                                    },
                                },
                            ]}
                        />
                        <br />
                        {messageType === "DM" && (
                            <>
                                <Checkbox
                                    legend="Envoyer uniquement aux membres @beta
                                        (pas etalab, ...) ?"
                                    options={[
                                        {
                                            label: "Oui",
                                            nativeInputProps: {
                                                name: "checkboxes-1",
                                                value: "true",
                                                checked: fromBeta,
                                                onChange: onChangeFromBeta,
                                            },
                                        },
                                    ]}
                                    state="default"
                                    stateRelatedMessage="State description"
                                />
                                <Input
                                    label="Souhaites-tu exclure des emails ?"
                                    hintText="Renseigne une liste d'email séparés
                                        par une virgule"
                                    nativeInputProps={{
                                        onChange: onChangeExcludeEmail,
                                        value: excludeEmails,
                                    }}
                                />
                                <Input
                                    label="Souhaites-tu uniquement envoyer à
                                        une liste d'utilisateur précis ?"
                                    hintText="Renseigne une liste d'email séparés
                                        par une virgule"
                                    nativeInputProps={{
                                        onChange: onChangeIncludeEmail,
                                        value: includeEmails,
                                    }}
                                />
                            </>
                        )}
                        {messageType === "channel" && (
                            <Select
                                label={"Sur quel canal envoyé le message ?"}
                                nativeSelectProps={{
                                    onChange: (e) => setChannel(e.target.value),
                                    value: channel,
                                }}
                            >
                                <option value="" disabled hidden>
                                    Sélectionne le canal sur lequel envoyé le
                                    message
                                </option>
                                {props.channelOptions.map((opt, index) => (
                                    <option key={index} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </Select>
                        )}
                        <Input
                            textArea={true}
                            label={`Quel texte envoyé aux membres de la communauté ?`}
                            hintText={`Tu peux utiliser du markdown et tester le rendu
                            du texte en cliquand sur "envoyer un test`}
                            nativeTextAreaProps={{
                                onChange: (e) => setText(e.target.value),
                                placeholder: "Texte à envoyer",
                            }}
                        />
                        <label htmlFor="prod">
                            <strong>
                                ⚠️ Attention ce message sera envoyé{" "}
                                {messageType === "channel"
                                    ? ` au canal ${
                                          (
                                              props.channelOptions.find(
                                                  (c) => c.value === channel
                                              ) as Option
                                          ).label
                                      }`
                                    : `à ${usersForMessage.length} membres`}
                            </strong>
                            <br />
                        </label>
                        <br />
                        <ButtonsGroup
                            buttons={[
                                {
                                    priority: "secondary",
                                    onClick: sendTest,
                                    children: "Envoyer un test",
                                },
                                {
                                    priority: "primary",
                                    onClick: send,
                                    children: "Envoyer",
                                },
                            ]}
                        />
                    </div>
                    <br />
                </div>
            </div>
            <AdminMattermostUser {...props} />
            <style media="screen">{css}</style>
        </>
    );
};
