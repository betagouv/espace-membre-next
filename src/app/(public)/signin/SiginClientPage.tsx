"use client";
import React from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@codegouvfr/react-dsfr/Button";
import routes, { computeRoute } from "@/routes/routes";
import config from "@/config";
import { fr } from "@codegouvfr/react-dsfr";

export default function SignClientPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get("next");

    const hash = window.location.hash.split("#")[1];
    const onSubmit = React.useCallback(async () => {
        const value = await axios.post(
            computeRoute(`${routes.SIGNIN_API}`),
            {
                token: hash,
            },
            {
                withCredentials: true,
            }
        );
        await axios.get(computeRoute(routes.ME), {
            withCredentials: true,
        });
        window.location.href = "/account";
    }, [hash]);

    React.useEffect(() => {
        onSubmit();
    }, [onSubmit]);

    if (!window) {
        return null;
    }
    return (
        <div>
            <p className={fr.cx("fr-mt-10v")}>
                Gère ton compte email (mot de passe, redirections, etc) et les
                membres de la communauté (arrivées et départs).
            </p>

            <div>
                <h4>
                    <center>Connexion à l'espace membre</center>
                </h4>
                <center>
                    <Button onClick={onSubmit}>Me connecter</Button>
                </center>
            </div>
        </div>
    );
}
