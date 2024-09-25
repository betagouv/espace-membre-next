"use client";

import { PropsWithChildren } from "react";

import Alert from "@codegouvfr/react-dsfr/Alert";

import frontConfig from "@/frontConfig";

export default function Layout(props: PropsWithChildren) {
    return (
        <div className="fr-grid-row fr-grid-row-gutters fr-grid-row--center ">
            {!!frontConfig.NEXT_PUBLIC_ALERT_MESSAGE_PUBLIC && (
                <Alert
                    className="fr-mb-4v fr-mt-4v"
                    severity={
                        frontConfig.NEXT_PUBLIC_ALERT_MESSAGE_PUBLIC.severity
                    }
                    closable={false}
                    description={
                        frontConfig.NEXT_PUBLIC_ALERT_MESSAGE_PUBLIC.description
                    }
                    title={frontConfig.NEXT_PUBLIC_ALERT_MESSAGE_PUBLIC.title}
                />
            )}
            {props.children}
        </div>
    );
}
