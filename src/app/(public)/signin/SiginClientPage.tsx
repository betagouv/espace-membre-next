"use client";
import React, { useEffect } from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import * as Sentry from "@sentry/nextjs";
import axios from "axios";
import { useSession } from "next-auth/react";

import frontConfig from "@/frontConfig";

export default function SignClientPage() {
    const [error, setError] = React.useState<string>("");
    const { status, data: session } = useSession();

    useEffect(() => {
        // Ensure this runs only on the client-side
        if (status === "authenticated" && typeof window !== "undefined") {
            window.location.href = "/dashboard";
        }
    }, [status]);

    function navigateToNextPage(url) {
        const hostname = window.location.origin; // Get the current hostname (e.g., https://example.com)
        const fullUrl = url.startsWith("/")
            ? `${hostname}${url}`
            : `${hostname}/${url}`;
        window.location.href = fullUrl;
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
                Sentry.captureException(e);
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
        if (typeof window !== "undefined") onSubmit();
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
