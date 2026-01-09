import React from "react";

import Button from "@codegouvfr/react-dsfr/Button";
import { fr } from "@codegouvfr/react-dsfr/fr";

import { EMAIL_PLAN_TYPE } from "@/models/ovh";

const urls = {
  [EMAIL_PLAN_TYPE.EMAIL_PLAN_PRO]: {
    webmail: "https://www.ovhcloud.com/fr/mail/",
    doc: "https://help.ovhcloud.com/csm/fr-documentation-web-cloud-email-collaborative-solutions-email-pro-setting-up-email-application-on-computer?id=kb_browse_cat&kb_id=e17b4f25551974502d4c6e78b7421955&kb_category=e51f33d425f465102d4c1520775fbc90&spa=1",
  },
  [EMAIL_PLAN_TYPE.EMAIL_PLAN_BASIC]: {
    webmail: "https://www.ovhcloud.com/fr/mail/",
    doc: "https://help.ovhcloud.com/csm/fr-documentation-web-cloud-email-collaborative-solutions-mx-plan-setting-up-email-application-on-computer?id=kb_browse_cat&kb_id=e17b4f25551974502d4c6e78b7421955&kb_category=501f3fd4b57ca5101e116e974e7ba4dd&spa=1",
  },
  [EMAIL_PLAN_TYPE.EMAIL_PLAN_EXCHANGE]: {
    webmail: "https://ex5.mail.ovh.net/",
    doc: "https://help.ovhcloud.com/csm/fr-documentation-web-cloud-email-collaborative-solutions-microsoft-exchange-setting-up-email-application-on-computer?id=kb_browse_cat&kb_id=e17b4f25551974502d4c6e78b7421955&kb_category=f61fb35491fc6510f078811c7bad9449&spa=1",
  },
  [EMAIL_PLAN_TYPE.EMAIL_PLAN_OPI]: {
    webmail: "https://webmail.numerique.gouv.fr",
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
      {plan === EMAIL_PLAN_TYPE.EMAIL_PLAN_OPI && (
        <Button
          title="Envoyer un email à support-messagerie@mail.numerique.gouv.fr"
          linkProps={{
            href: "mailto:support-messagerie@mail.numerique.gouv.fr",
          }}
          iconId="ri-question-fill"
          priority="secondary"
          size="small"
          className={fr.cx("fr-ml-1w")}
        >
          Support : support-messagerie@mail.numerique.gouv.fr
        </Button>
      )}
    </>
  );
};
