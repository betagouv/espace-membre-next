import { BadgeDossier } from "@/models/badgeDemande";
import { BadgeRequest } from "@/models/badgeRequests";
import routes, { computeRoute } from "@/routes/routes";
import Button from "@codegouvfr/react-dsfr/Button";
import axios from "axios";
import React, { useState } from "react";

export const WelcomeScreen = function ({
    next,
    badgeRequest,
    dossier,
    setDSToken,
}: {
    next: () => void;
    badgeRequest: BadgeRequest;
    dossier: BadgeDossier;
    setDSToken: React.Dispatch<React.SetStateAction<string | null>>;
}) {
    const [isSaving, setIsSaving] = useState(false);

    function askForBadge() {
        if (dossier || badgeRequest) {
            next();
        } else {
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
                    setDSToken(resp.data.dossier_token);
                    next();
                })
                .catch((resp) => {
                    setIsSaving(false);
                });
        }
    }

    return (
        <>
            <h2>Demande de badge</h2>
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
            <Button onClick={askForBadge}>Faire la demande de badge</Button>
        </>
    );
};
