"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import axios from "axios";
import { useSession } from "next-auth/react";

import routes, { computeRoute } from "@/routes/routes";

export default function SignClientPage() {
    const [error, setError] = React.useState<string>("");
    const { status, data: session } = useSession();

    if (status === "authenticated") {
        window.location.href = "/account";
    }

    const onSubmit = React.useCallback(async () => {
        const hash =
            window !== undefined ? window.location.hash.split("#")[1] : null;
        setError("");
        if (hash) {
            await axios
                .get(hash, {
                    withCredentials: true,
                })
                // .then((r) =>
                //     axios.get(computeRoute(routes.ME), {
                //         withCredentials: true,
                //     })
                // )
                .then((r) => {
                    window.location.href = "/account";
                })
                .catch((e) => {
                    if (e.response?.data?.error) {
                        setError(e.response?.data?.error);
                    }
                });
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
