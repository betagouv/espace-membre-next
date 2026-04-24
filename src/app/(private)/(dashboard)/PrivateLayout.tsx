import Alert from "@codegouvfr/react-dsfr/Alert";
import frontConfig from "@/frontConfig";
import React from "react";
import { BreadCrumbs } from "./BreadCrumbs";

const isCurrentPath = (pathname, rootPath) => pathname.startsWith(rootPath);

export function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadCrumbs />
      <div className="fr-grid-row fr-grid-row-gutters fr-my-4w">
        {!!frontConfig.NEXT_PUBLIC_ALERT_MESSAGE_PRIVATE && (
          <Alert
            className="fr-mb-8v"
            severity={frontConfig.NEXT_PUBLIC_ALERT_MESSAGE_PRIVATE.severity}
            closable={false}
            description={
              frontConfig.NEXT_PUBLIC_ALERT_MESSAGE_PRIVATE.description
            }
            title={frontConfig.NEXT_PUBLIC_ALERT_MESSAGE_PRIVATE.title}
          />
        )}
        <div className={`fr-col-12 fr-col-md-12 fr-col-lg-12`}>{children}</div>
      </div>
    </>
  );
}
