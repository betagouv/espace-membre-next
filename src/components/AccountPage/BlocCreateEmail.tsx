import React from "react";

import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import axios from "axios";

import routes, { computeRoute } from "@/routes/routes";

export default function BlocCreateEmail({
    hasPublicServiceEmail = false,
    secondaryEmail = "",
    userInfos,
}: {
    hasPublicServiceEmail: boolean;
    secondaryEmail: string;
    userInfos: any;
}) {
    const [email, setEmail] = React.useState(secondaryEmail);
    return (
        <>
            <p>Tu peux créer ton compte email @beta.gouv.fr.</p>
            {hasPublicServiceEmail &&
                `Attention tu as une adresse de service public en adresse primaire. Si tu créés une adresse @beta.gouv.fr, elle deviendra ton adresse primaire :
                    celle à utiliser pour mattermost, et d'autres outils.`}
            <form
                className="no-margin"
                onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                        await axios.post(
                            computeRoute(routes.USER_CREATE_EMAIL_API).replace(
                                ":username",
                                userInfos.id
                            ),
                            {
                                to_email: email,
                            },
                            {
                                withCredentials: true,
                            }
                        );
                        alert("Ton email a bien été créé.");
                    } catch (e) {
                        alert(
                            `Ton email n'a pas pu être créé suite à une erreur.`
                        );
                    }
                }}
            >
                <Input
                    label="Email personnel ou professionnel"
                    hintText="Les informations de connexion seront envoyées à cet
                        email"
                    nativeInputProps={{
                        defaultValue: email,
                        onChange: (e) => setEmail(e.currentTarget.value),
                        name: "to_email",
                        type: "email",
                        required: true,
                    }}
                />
                <Button type="submit">Créer un compte</Button>
            </form>
            <br />
            <br />
        </>
    );
}
