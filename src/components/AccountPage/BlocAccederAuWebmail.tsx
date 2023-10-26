import Accordion from "@codegouvfr/react-dsfr/Accordion"
import React from "react"

export default function BlocAccederAuWebmail() {
    return <Accordion label="Accéder au webmail">
        <p>
            Tu peux consulter tes mails directement sur l'interface d'OVH. Elle n'est pas très
            confortable mais ça peut être une bonne solution pour dépanner, ou quand tu n'a pas
            accès à ton client web habituel.
        </p>
        <a href="https://mail.ovh.net/roundcube/?_user=<%= userInfos.id %>@<%= domain %>"
            target="_blank"
            className="fr-link">Webmail</a>
    </Accordion>
}
