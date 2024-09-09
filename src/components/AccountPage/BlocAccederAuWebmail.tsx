import React from "react";

import Accordion from "@codegouvfr/react-dsfr/Accordion";

export default function BlocAccederAuWebmail({
    isExchange = false,
}: {
    isExchange: boolean;
}) {
    return (
        <Accordion label="Accéder au webmail">
            <p>
                Tu peux consulter tes mails directement sur l'interface d'OVH.
                Elle n'est pas très confortable mais ça peut être une bonne
                solution pour dépanner, ou quand tu n'a pas accès à ton client
                web habituel.
            </p>
            <a
                href={
                    isExchange
                        ? "https://ex5.mail.ovh.net/"
                        : "https://www.ovhcloud.com/fr/mail/"
                }
                target="_blank"
                className="fr-link"
            >
                Webmail
            </a>
        </Accordion>
    );
}
