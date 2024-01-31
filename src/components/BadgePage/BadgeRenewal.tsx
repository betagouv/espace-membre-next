import config from "@/frontConfig";
import { BadgeDossier } from "@/models/badgeDemande";
import { BadgeRequest } from "@/models/badgeRequests";
import routes, { computeRoute } from "@/routes/routes";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import axios from "axios";
import { useState } from "react";

export interface BadgeRenewalProps {
    badgeRequest: BadgeRequest;
    dossier: BadgeDossier;
}

export default function BadgeRenewal({
    badgeRequest,
    dossier,
}: BadgeRenewalProps) {
    const [understoodBox, setUnderstoodBox] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [forceRequest, setForceRequest] = useState<boolean>(false);

    const [dsToken, setDSToken] = useState(
        badgeRequest ? badgeRequest.ds_token : null
    );
    function askForBadge() {
        if (isSaving) {
            return;
        }
        setIsSaving(true);
        axios
            .post(
                computeRoute(routes.API_POST_BADGE_RENEWAL_REQUEST),
                undefined,
                {
                    withCredentials: true,
                }
            )
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
            <h2>Demande de renouvellement de badge</h2>
            {!!dossier && (
                <>
                    {dossier.state === "en_instruction" && (
                        <Alert
                            title="Vous avez déjà un renouvellement de badge en cours d'instruction"
                            description={`Vous avez déjà un renouvellement de badge en cours, vous serez notifié par email quand le badge sera renouvelé. Cela peux prendre une semaine.
                            Si vous n'avez pas de nouvelle, merci de faire un message dans le canal ~bureau-segur de mattermost.`}
                            severity="info"
                        />
                    )}
                    {dossier.state === "accepte" && (
                        <Alert
                            title="Votre badge est renouvelé."
                            description="Votre badge est normalement renouvelé. Si il ne marche toujours pas, merci de faire un message dans le canal ~bureau-segur de mattermost."
                            severity="info"
                        />
                    )}
                    <br />

                    {!forceRequest && (
                        <>
                            <p>
                                Si tu penses qu'il y a une erreur, tu peux
                                refaire une demande.
                            </p>
                            <Button
                                priority="secondary"
                                nativeButtonProps={{
                                    onClick: () => {
                                        setForceRequest(true);
                                    },
                                }}
                            >
                                Refaire une demande
                            </Button>
                        </>
                    )}
                </>
            )}
            {(!dossier || forceRequest) && (
                <>
                    <p>
                        Tu t'apprêtes à faire une demande de renouvellement de
                        badge.
                        <br />
                        C'est donc que tu as actuellement un badge mais qu'il ne
                        fonctionne plus. Pour prolonger ton badge, il faut que
                        tu viennes au minimum deux fois par semaine.
                    </p>
                    <p>
                        Sinon tu devras demander un badge invité à chacune des
                        tes venues. Ce sont les régles du batiment Ségur nous
                        n'y pouvont rien.
                    </p>

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
                                    Poursuivre la démarche sur
                                    démarches-simplifiees.fr
                                </Button>
                            )}
                            {understoodBox && (
                                <Button
                                    linkProps={{
                                        target: "_blank",
                                        href: `${config.DS_BADGE_RENEWAL_FORM_URL}${dsToken}`,
                                    }}
                                >
                                    Poursuivre la démarche sur
                                    démarches-simplifiees.fr
                                </Button>
                            )}
                        </>
                    }
                </>
            )}
        </>
    );
}
