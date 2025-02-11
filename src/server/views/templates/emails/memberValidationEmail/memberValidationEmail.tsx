import { MjmlButton, MjmlText } from "@luma-team/mjml-react";

import { EmailNewMemberValidation } from "@/server/modules/email";

export function MemberValidationEmailTitle() {
    return `Nouveau membre à valider`;
}

export function MemberValidationEmail(
    props: EmailNewMemberValidation["variables"]
) {
    const title = MemberValidationEmailTitle();

    return (
        <>
            <MjmlText>
                <h1>{title}</h1>
                <p>Bonjour,</p>
                <p>
                    Tu reçois cet email car tu fais partie d'une équipe
                    transverse de l'incubateur : {props.incubator.title}
                </p>
                <p>
                    Une nouvelle fiche membre a été créée avec une mission qui
                    concerne ton incubateur. Merci de valider cette fiche si tu
                    es au courant de l'arrivé de cette personne.
                </p>
                <p>
                    <ul>
                        <li key={"fullname"}>
                            Prénom Nom : {props.userInfos.fullname}
                        </li>
                        <li>Domaine : {props.userInfos.domaine}</li>
                        <li>
                            Produits :{" "}
                            {props.startups.map((s) => s.name).join(", ")}
                        </li>
                    </ul>
                </p>
            </MjmlText>
            <MjmlText>
                <p>
                    Cette personne est-elle bien un membre de ton incubateur ?
                    Si oui, clique sur le bouton ci-dessous.
                </p>
            </MjmlText>
            <MjmlButton href={props.validationLink}>
                Valider le membre
            </MjmlButton>
            <MjmlText></MjmlText>
        </>
    );
}
