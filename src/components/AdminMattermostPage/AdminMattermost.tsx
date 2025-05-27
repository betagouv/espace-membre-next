"use client";
import React, { useEffect, useState } from "react";

import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import Select from "@codegouvfr/react-dsfr/Select";
import axios from "axios";

import { AdminMattermostUser } from "./AdminMattermostUser";
import { safeGetMattermostUsersInfo } from "@/app/api/admin/actions/getMattermostUsersInfo";
import { safeSendMessageToUsersOnChat } from "@/app/api/admin/actions/sendMattermostMessage";
import { MattermostUser } from "@/lib/mattermost";
import { memberBaseInfoSchemaType } from "@/models/member";
import routes, { computeRoute } from "@/routes/routes";

interface Option {
  value: string;
  label: string;
}

export interface AdminMattermostProps {
  title: string;
  currentUserId: string;
  errors: string[];
  messages: string[];
  users: memberBaseInfoSchemaType[];
  activeTab: string;
  isAdmin: boolean;
  channelOptions: Option[];
}

const css = ".panel { min-height: 400px; }"; // to have enough space to display dropdown

/* Pure component */
export const AdminMattermost = (props: AdminMattermostProps) => {
  const [usersForMessage, setUsersForMessage] = useState<MattermostUser[]>([]);
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
      excludeEmails: excludeEmails.split(",").filter((email) => email),
      includeEmails: includeEmails.split(",").filter((email) => email),
      fromBeta,
    };
    const queryParamsString = Object.keys(params)
      .map((key) => key + "=" + params[key])
      .join("&");
    try {
      const usersForMessage = await safeGetMattermostUsersInfo(params).then(
        (resp) => {
          if (resp.success) {
            return resp.data.users;
          } else {
            alert("Impossible de récupérer la liste d'utilisateur");
          }
          return [];
        },
      );
      setUsersForMessage(usersForMessage);
    } catch (e) {}
  };

  const buildParams = (prod) => {
    return {
      fromBeta,
      prod,
      includeEmails: includeEmails.split(",").filter((email) => email),
      excludeEmails: excludeEmails.split(",").filter((email) => email),
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
              (props.channelOptions.find((c) => c.value === channel) as Option)
                .label
            : "à " + usersForMessage.length + " membres ?"
        }`,
      ) === true
    ) {
      const res = await safeSendMessageToUsersOnChat(buildParams(true));
      if (res.success) {
        alert(`Message envoyé`);
      } else {
        alert(`Echec de l'envoi du message`);
      }
    } else {
      alert(`Le message n'a pas été envoyé`);
    }
  };
  const sendTest = async () => {
    try {
      const res = await safeSendMessageToUsersOnChat(buildParams(false));
      if (res.success) {
        alert(`Message envoyé`);
      } else {
        alert(`Echec de l'envoi du message`);
      }
    } catch (e) {
      console.error("Erreur");
    }
  };
  const [value, setValue] = useState<"one" | "two" | "three" | undefined>(
    undefined,
  );
  const getCurrentChannel = (): string => {
    const currentChannel = props.channelOptions.find(
      (c) => c.value === channel,
    );
    if (currentChannel) {
      return currentChannel.label;
    } else {
      return "channel non définie";
    }
  };
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
                  Sélectionne le canal sur lequel envoyé le message
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
                  ? ` au canal ${getCurrentChannel()}`
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
