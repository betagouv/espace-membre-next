"use client";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@codegouvfr/react-dsfr/Button";
import routes, { computeRoute } from "@/routes/routes";

export default function SignClientPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get("next");
    if (!window) {
        return null;
    }
    const hash = window.location.hash.split("#")[1];
    const onSubmit = async () => {
        const value = await axios.post(computeRoute(routes.SIGNIN_API), {
            token: hash,
        });
        await axios.get(computeRoute(routes.ME));
        router.push("/account");
    };

    return (
        <div>
            <p>
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
