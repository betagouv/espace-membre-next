import React from "react";
import { fr } from "@codegouvfr/react-dsfr/fr";
import Accordion from "@codegouvfr/react-dsfr/Accordion";

export const getWebMailUrl = (isExchange: boolean) =>
    isExchange
        ? "https://ex5.mail.ovh.net/"
        : "https://www.ovhcloud.com/fr/mail/";

export const WebMailButton = ({
    isExchange,
    className,
}: {
    isExchange: boolean;
    className: string;
}) => (
    <a
        className={[fr.cx("fr-btn"), className].join(" ")}
        href={getWebMailUrl(isExchange)}
        target="_blank"
    >
        Webmail
    </a>
);
