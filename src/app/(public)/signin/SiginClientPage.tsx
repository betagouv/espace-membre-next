"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import axios from "axios";
import { useSession } from "next-auth/react";

import frontConfig from "@/frontConfig";

export default function SignClientPage() {
    const [error, setError] = React.useState<string>("");
    const { status, data: session } = useSession();

    if (status === "authenticated") {
        window.location.href = "/dashboard";
    }

    function navigateToNextPage(url) {
        const parsedUrl = new URL(url);
        const searchParams = parsedUrl.searchParams || "";
        const callbackUrl = searchParams.get("callbackUrl") || "";
        const allowedDomains = [frontConfig.host];

        // Create an anchor element to parse the URL
        const anchor = document.createElement("a");
        anchor.href = callbackUrl;

        // Extract the hostname from the callback URL
        const callbackHostname = anchor.host;
        // Validate if the callbackUrl is internal or part of trusted domains
        if (
            callbackUrl.startsWith("/") ||
            allowedDomains.includes(callbackHostname)
        ) {
            // Safe to redirect
            window.location.href = callbackUrl;
        } else {
            // Redirect to a default safe URL (e.g., dashboard)
            window.location.href = "/dashboard";
        }
    }

    const onSubmit = React.useCallback(async () => {
        const url =
            window !== undefined ? window.location.hash.split("#")[1] : null;
        setError("");
        if (url) {
            try {
                await axios.get(url, {
                    withCredentials: true,
                });
                navigateToNextPage(url);
            } catch (e: any) {
                if (e.response?.data?.error) {
                    setError(e.response?.data?.error);
                }
            }
        }
    }, []);

    const onRetry = () => {
        document.location = "/";
    };

    React.useEffect(() => {
        if (window) onSubmit();
    }, [onSubmit]);

    return (
        <div>
            <p className={fr.cx("fr-mt-10v")}>
                Gère ton compte email (mot de passe, redirections, etc) et les
                membres de la communauté (arrivées et départs).
            </p>
            {(error && (
                <div>
                    <Alert
                        closable
                        description={error}
                        severity="error"
                        title="Le formulaire a renvoyé une erreur"
                    />
                    <br />
                    <center>
                        <Button onClick={onRetry}>
                            Demander un nouveau lien de connexion
                        </Button>
                    </center>
                </div>
            )) || (
                <div>
                    <h4>
                        <center>Connexion à l'espace membre</center>
                    </h4>
                    <center>
                        <Button onClick={onSubmit}>Me connecter</Button>
                    </center>
                </div>
            )}
        </div>
    );
}
