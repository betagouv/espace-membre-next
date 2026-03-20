import React from "react";

import Button from "@codegouvfr/react-dsfr/Button";
import { fr } from "@codegouvfr/react-dsfr/fr";

import { EMAIL_PLAN_TYPE } from "@/models/ovh";

const urls = {
  [EMAIL_PLAN_TYPE.EMAIL_PLAN_OPI]: {
    webmail: "https://messagerie.numerique.gouv.fr",
    doc: "https://doc.incubateur.net/communaute/les-outils-de-la-communaute/emails/emails-suite-numerique",
  },
};

export const WebMailButtons = ({ plan }: { plan: EMAIL_PLAN_TYPE }) => {
  const provider = urls[plan];
  const webmailUrl = provider.webmail;
  const documentationUrl = provider.doc;
  return (
    <>
      <Button
        iconId="ri-mail-check-fill"
        linkProps={{ href: webmailUrl, target: "_blank" }}
        size="small"
      >
        Webmail
      </Button>
      <Button
        linkProps={{
          href: documentationUrl,
          target: "_blank",
        }}
        iconId="ri-book-2-fill"
        priority="secondary"
        size="small"
        className={fr.cx("fr-ml-1w")}
      >
        Documentation
      </Button>
      <Button
        title="Envoyer un email à support-messagerie@numerique.gouv.fr"
        linkProps={{
          href: "mailto:support-messagerie@numerique.gouv.fr",
        }}
        iconId="ri-question-fill"
        priority="secondary"
        size="small"
        className={fr.cx("fr-ml-1w")}
      >
        Support : support-messagerie@numerique.gouv.fr
      </Button>
    </>
  );
};
