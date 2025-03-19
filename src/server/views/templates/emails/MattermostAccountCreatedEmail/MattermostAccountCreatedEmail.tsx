import React from "react";

import { MjmlColumn, MjmlText, MjmlButton } from "@luma-team/mjml-react";

import { StandardLayout } from "@/components/emails/layouts/StandardEmail";
import { EmailMattermostAccountCreated } from "@/server/modules/email";
export function MattermostAccountCreatedEmailTitle() {
    return `Ton compte mattermost a été créé.`;
}

export function MattermostAccountCreatedEmail({
    resetPasswordLink,
    email,
    fullname,
}: EmailMattermostAccountCreated["variables"]) {
    const title = MattermostAccountCreatedEmailTitle();

    return (
        <StandardLayout title={title}>
            <MjmlText>Hello {fullname} ! 👋</MjmlText>
            <MjmlText>
                Ton compte Mattermost a été créé avec l'adresse : <i>{email}</i>
                .
            </MjmlText>
            <MjmlText>
                Il faut maintenant que tu définisses ton mot de passe. Pour ce
                faire, suis la procédure de réinitialisation de mot de passe en
                cliquant sur le bouton suivant :
            </MjmlText>
            <MjmlButton href={resetPasswordLink}>
                Définir mon password
            </MjmlButton>
            <MjmlText>
                Si le bouton ne fonctionne pas, tu peux utiliser ce lien :<br />
                <a href={resetPasswordLink}>{resetPasswordLink}</a>
            </MjmlText>
            <MjmlText>
                Une fois connecté·e, n'oublie pas d'ajouter un rôle et une image
                à ton profil Mattermost pour rendre les échanges plus faciles.
            </MjmlText>
            <MjmlText>
                Tu trouveras dans cette documentation des astuces d'utilisation
                ainsi que les canaux intéressants à rejoindre :{" "}
                <a href="https://doc.incubateur.net/communaute/les-outils-de-la-communaute/mattermost">
                    https://doc.incubateur.net/communaute/les-outils-de-la-communaute/mattermost
                </a>
            </MjmlText>
            <MjmlText>
                En cas de problème avec ton compte, n'hésite pas à répondre à ce
                mail !
            </MjmlText>
            <MjmlText>Bonne journée</MjmlText>
        </StandardLayout>
    );
}
