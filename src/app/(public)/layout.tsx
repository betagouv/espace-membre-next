"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";

import frontConfig from "@/frontConfig";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fr-grid-row fr-grid-row-gutters fr-grid-row--center ">
      {!!frontConfig.NEXT_PUBLIC_ALERT_MESSAGE_PUBLIC && (
        <Alert
          className="fr-mb-4v fr-mt-4v"
          severity={frontConfig.NEXT_PUBLIC_ALERT_MESSAGE_PUBLIC.severity}
          closable={false}
          description={frontConfig.NEXT_PUBLIC_ALERT_MESSAGE_PUBLIC.description}
          title={frontConfig.NEXT_PUBLIC_ALERT_MESSAGE_PUBLIC.title}
        />
      )}
      {children}
    </div>
  );
}
