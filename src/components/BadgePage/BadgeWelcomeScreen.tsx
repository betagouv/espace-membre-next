import config from "@/config";
import { BadgeRequest } from "@/models/badgeRequests";
import routes, { computeRoute } from "@/routes/routes";
import Button from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import axios from "axios";
import React, { useState } from "react";

export const WelcomeScreen = function ({
    badgeRequest,
}: {
    badgeRequest: BadgeRequest;
}) {
    const [isSaving, setIsSaving] = useState(false);
    const [understoodBox, setUnderstoodBox] = useState<boolean>(false);
    const [dsToken, setDSToken] = useState(
        badgeRequest ? badgeRequest.ds_token : null
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
                Sinon tu devras demander un badge invité à chacune des tes
                venues. Ce sont les régles du batiment Ségur nous n'y pouvont
                rien.
            </p>

            <p>
                Pour faire une demande de badge il te faut les document
                suivants:
            </p>
            <ul>
                <li>une photo de ta piéce d'identité</li>
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
