import { MjmlButton, MjmlText } from "@luma-team/mjml-react";

import { StandardLayout } from "@/components/emails/layouts/StandardEmail";
import { EmailMatomoAccountUpdated } from "@/server/modules/email";

export function MatomoAccountUpdatedEmailTitle() {
    return `Ton compte matomo vient d'être mis à jour`;
}

export function MatomoAccountUpdatedEmail({
    email,
    fullname,
    matomoUrl,
    newSite,
    sites,
}: EmailMatomoAccountUpdated["variables"]) {
    const title = MatomoAccountUpdatedEmailTitle();

    return (
        <StandardLayout title={title}>
            <MjmlText>
                <h1>{title}</h1>
                <p>Bonjour {fullname},</p>
                <p>
                    Ton compte matomo (email: {email}) vient d'être mis à jour
                    pour y ajouter les sites suivants :
                </p>
                <ul>
                    {newSite && <li>nouveau site : {newSite.url}</li>}
                    {sites &&
                        sites.map((s) => (
                            <li key={s.id}>
                                site existant avec l'identifiant : {s.id}
                            </li>
                        ))}
                </ul>
                <p>Tu devrais les voir apparaitre dans ton matomo :</p>
            </MjmlText>
            <MjmlButton href={matomoUrl}>Me connecter à Matomo</MjmlButton>
            <MjmlText>
                <p>
                    Si le bouton ne fonctionne pas, tu peux utiliser ce lien :{" "}
                    <a href={matomoUrl}>{matomoUrl}</a>.
                </p>
                <p>
                    Tu trouveras dans cette documentation des astuces
                    d'utilisation ainsi que les canaux intéressants à rejoindre
                    :{" "}
                    <a href="https://doc.incubateur.net/communaute/les-outils-de-la-communaute/autres-services/matomo">
                        documentation Matomo
                    </a>
                </p>

                <p>
                    En cas de problème avec ton compte, n'hésite pas à répondre
                    à ce mail !
                </p>

                <p>Bonne journée</p>
            </MjmlText>
            <MjmlText></MjmlText>
        </StandardLayout>
    );
}
