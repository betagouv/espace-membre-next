import React, { useState } from "react";

import Button from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import axios from "axios";

import config from "@/frontConfig";
import { badgeRequestSchemaType } from "@/models/badgeRequests";
import routes, { computeRoute } from "@/routes/routes";

export const WelcomeScreen = function ({
    badgeRequest,
}: {
    badgeRequest?: badgeRequestSchemaType;
}) {
    const [isSaving, setIsSaving] = useState(false);
    const [understoodBox, setUnderstoodBox] = useState<boolean>(false);
    const [dsToken, setDSToken] = useState(
        badgeRequest ? badgeRequest.ds_token : null,
    );
    function askForBadge() {
        if (isSaving) {
            return;
        }
        setIsSaving(true);
        axios
            .post(computeRoute(routes.API_POST_BADGE_REQUEST), undefined, {
                withCredentials: true,
            })
            .then((resp) => {
                setIsSaving(false);
                setUnderstoodBox(!understoodBox);
                setDSToken(resp.data.dossier_token);
            })
            .catch((resp) => {
                setIsSaving(false);
            });
    }

    return (
        <>
            <p>
                Tu t'apprêtes à faire une demande de badge.
                <br />
                Pour demander un badge, il faut que tu viennes au minimum deux
                fois par semaine.
            </p>
            <p>
                Sinon, tu devras demander un badge invité à chacune des tes
                venues. Ce sont les règles du batiment Ségur nous n'y pouvons
                rien.
            </p>

            <p>
                Pour faire une demande de badge il te faut les documents
                suivants :
            </p>
            <ul>
                <li>une photo de ta pièce d'identité</li>
                <li>une photo d'identité</li>
            </ul>

            {
                <>
                    <Checkbox
                        options={[
                            {
                                label: "J'ai compris",
                                nativeInputProps: {
                                    name: "checkboxes-1",
                                    value: "true",
                                    onChange: (e) => {
                                        askForBadge();
                                    },
                                },
                            },
                        ]}
                        state="default"
                    ></Checkbox>
                    {!understoodBox && (
                        <Button disabled={true}>
                            Poursuivre la démarche sur démarches-simplifiees.fr
                        </Button>
                    )}
                    {understoodBox && (
                        <Button
                            linkProps={{
                                target: "_blank",
                                href: `${config.DS_BADGE_FORM_URL}${dsToken}`,
                            }}
                        >
                            Poursuivre la démarche sur démarches-simplifiees.fr
                        </Button>
                    )}
                </>
            }
        </>
    );
};
