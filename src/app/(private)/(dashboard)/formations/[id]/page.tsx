import type { Metadata, ResolvingMetadata } from "next";
import { redirect } from "next/navigation";
import { routeTitles } from "@/utils/routes/routeTitles";
import { getSessionFromStore } from "@/server/middlewares/sessionMiddleware";
import { cookies } from "next/headers";
import config from "@/server/config";
import Card from "@codegouvfr/react-dsfr/Card";
import Button from "@codegouvfr/react-dsfr/Button";
import { durationBetweenDate } from "@/utils/date";
import { fetchAirtableFormationById } from "@/lib/airtable";
import { format } from "date-fns/format";
import { fr } from "date-fns/locale/fr";
import { BreadCrumbFiller } from "@/app/BreadCrumbProvider";
import betagouv from "@/server/betagouv";
import { Domaine, Member } from "@/models/member";
import db from "@/server/db";
import { CommunicationEmailCode, DBUser } from "@/models/dbUser";

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    // fetch data
    const formation = await fetchAirtableFormationById(params.id);
    return {
        title: `${formation.name} / Espace Membre`,
    };
}

type Props = {
    params: { id: string };
};

enum AirtableDomaine {
    Intrapreneur = "Intrapreneur.e",
    "Chargé.e de déploiement" = "Chargé.e de déploiement",
    "Chargé.e de Support usagers" = "Chargé.e de Support usagers",
    "Développpeur.euse" = "Développeur.euse",
    "UX Designer" = "UX Designer",
    "Coach" = "Coach",
    "Animateur.ice" = "Animateur.ice",
    "Product Owner" = "Product Owner",
    "Growth Hacker" = "Growth Hacker",
}

const DomaineToAirtableDomaine: Record<Domaine, AirtableDomaine> = {
    [Domaine.INTRAPRENARIAT]: AirtableDomaine.Intrapreneur,
    [Domaine.ANIMATION]: AirtableDomaine["Animateur.ice"],
    [Domaine.COACHING]: AirtableDomaine.Coach,
    [Domaine.DEPLOIEMENT]: AirtableDomaine["Chargé.e de déploiement"],
    [Domaine.DESIGN]: AirtableDomaine["UX Designer"],
    [Domaine.DEVELOPPEMENT]: AirtableDomaine["Développpeur.euse"],
    [Domaine.PRODUIT]: AirtableDomaine["Product Owner"],
    [Domaine.AUTRE]: AirtableDomaine[""],
};

export default async function Page({ params }: Props) {
    const cookieStore = cookies();
    const session = (await getSessionFromStore(
        cookieStore.get(config.SESSION_COOKIE_NAME)
    )) as { id: string };
    if (!session) {
        redirect("/login");
    }
    const buildInscriptionLink = (originalUrl: string, user: Member) => {
        const url = new URL(originalUrl);
        const newParams = {
            prefill_Nom: user.fullname,
            prefill_Email: user.email,
            prefill_Domaine: DomaineToAirtableDomaine[user.domaine],
            prefill_username: user.id,
        };
        // Access the current search parameters
        const searchParams = new URLSearchParams(url.search);

        // Add new query parameters from the newParams object
        Object.keys(newParams).forEach((key) => {
            searchParams.set(key, newParams[key]);
        });
        // Set the modified search parameters back to the URL object
        url.search = searchParams.toString();

        // Return the modified URL as a string
        return url.toString();
    };
    const formation = await fetchAirtableFormationById(params.id);

    const user = (await betagouv.userInfosById(session.id)) as Member;
    const dbUser: DBUser = await db("users")
        .where({
            username: session.id,
        })
        .first();
    if (user) {
        user.email =
            dbUser.communication_email === CommunicationEmailCode.PRIMARY
                ? dbUser.primary_email
                : dbUser.secondary_email;
    }
    const isMemberRegistered = formation.registeredMembers?.includes(user.id);
    return (
        <>
            <BreadCrumbFiller currentPage={formation.name}></BreadCrumbFiller>
            <div className="fr-container fr-container--fluid">
                <h1>{formation.name}</h1>
                <div className="fr-grid-row fr-grid-row--gutters">
                    <div className="fr-col-4">
                        <Card
                            background
                            border
                            imageAlt={`${formation.name} image`}
                            imageUrl={formation.imageUrl}
                            size="medium"
                            desc={
                                <>
                                    <p>
                                        Animateur :{" "}
                                        {formation.animator ||
                                            formation.animatorEmail}
                                    </p>
                                    {!!(formation.end && formation.start) && (
                                        <p>
                                            Durée :{" "}
                                            {durationBetweenDate(
                                                formation.end,
                                                formation.start
                                            )}
                                        </p>
                                    )}
                                    {formation.maxSeats !== undefined &&
                                        formation.availableSeats !==
                                            undefined && (
                                            <p>
                                                Inscription: {}
                                                {formation.availableSeats > 0
                                                    ? formation.maxSeats -
                                                      formation.availableSeats
                                                    : formation.maxSeats}
                                                /{formation.maxSeats}
                                            </p>
                                        )}
                                    {!isMemberRegistered ? (
                                        <Button
                                            linkProps={{
                                                href: buildInscriptionLink(
                                                    formation.inscriptionLink,
                                                    user
                                                ),
                                                target: "_blank",
                                            }}
                                        >
                                            {formation.availableSeats <= 0
                                                ? `M'inscrire sur liste d'attente`
                                                : `M'inscrire`}
                                        </Button>
                                    ) : (
                                        "Vous êtes déjà inscrit"
                                    )}
                                </>
                            }
                            title={
                                formation.startDate
                                    ? format(
                                          formation.startDate,
                                          "d MMMM à HH'h'mm",
                                          { locale: fr }
                                      )
                                    : "Formation en ligne"
                            }
                            titleAs="h3"
                        ></Card>
                    </div>
                    <div className="fr-col-8">
                        <p>{formation.description}</p>
                    </div>
                </div>
                <div className="fr-my-4w">
                    <a
                        href="/formations"
                        className="fr-link fr-link--lg fr-link--icon-left fr-icon-arrow-left-line"
                    >
                        Voir toutes les formations
                    </a>
                </div>
            </div>
        </>
    );
}
