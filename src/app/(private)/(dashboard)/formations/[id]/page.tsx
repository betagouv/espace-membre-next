import { Badge } from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import Card from "@codegouvfr/react-dsfr/Card";
import { format } from "date-fns/format";
import { fr } from "date-fns/locale/fr";
import type { Metadata, ResolvingMetadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { BreadCrumbFiller } from "@/app/BreadCrumbProvider";
import { fetchAirtableFormationById } from "@/lib/airtable";
import { db } from "@/lib/kysely";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { userInfosToModel } from "@/models/mapper";
import { CommunicationEmailCode } from "@/models/member";
import { Domaine } from "@/models/member";
import { authOptions } from "@/utils/authoptions";
import { durationBetweenDate } from "@/utils/date";

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
    "Data" = "Data",
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
    [Domaine.DATA]: AirtableDomaine["Data"],
};

export default async function Page({ params }: Props) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }
    const buildInscriptionLink = (
        originalUrl: string,
        user: {
            fullname: string;
            email: string;
            username: string;
            domaine: Domaine;
        }
    ) => {
        const url = new URL(originalUrl);
        const newParams = {
            prefill_Nom: user.fullname,
            prefill_Email: user.email,
            prefill_Domaine: DomaineToAirtableDomaine[user.domaine],
            prefill_username: user.username,
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

    const dbUser = userInfosToModel(
        await getUserInfos({
            uuid: session.user.uuid,
        })
    );
    if (!dbUser) {
        redirect("/");
        return;
    }
    let email;
    if (dbUser) {
        email =
            dbUser.communication_email === CommunicationEmailCode.PRIMARY
                ? dbUser.primary_email
                : dbUser.secondary_email;
    }
    const isMemberRegistered = formation.registeredMembers?.includes(
        dbUser.username
    );
    const isInWaitingList = formation.waitingListUsernames?.includes(
        dbUser.username
    );

    return (
        <>
            <BreadCrumbFiller currentPage={formation.name}></BreadCrumbFiller>
            <div className="fr-container fr-container--fluid">
                <h1>{formation.name}</h1>
                <div className="fr-grid-row fr-grid-row--gutters">
                    <div className="fr-col-md-4 fr-col-lg-4 fr-col-sm-12">
                        <Card
                            background
                            border
                            badges={
                                !!formation.isELearning
                                    ? [
                                          <Badge
                                              key={"e-learning"}
                                              severity="new"
                                          >
                                              E-learning
                                          </Badge>,
                                      ]
                                    : undefined
                            }
                            imageAlt={``}
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
                                                    {
                                                        fullname:
                                                            dbUser.fullname,
                                                        email,
                                                        username:
                                                            dbUser.username,
                                                        domaine: dbUser.domaine,
                                                    }
                                                ),
                                                target: "_blank",
                                            }}
                                        >
                                            {formation.availableSeats <= 0
                                                ? `M'inscrire sur liste d'attente`
                                                : `M'inscrire`}
                                        </Button>
                                    ) : isInWaitingList ? (
                                        <Badge>
                                            Inscrit sur liste d'attente
                                        </Badge>
                                    ) : (
                                        <Badge severity="success">
                                            Inscrit
                                        </Badge>
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
                            titleAs="h2"
                        ></Card>
                    </div>
                    <div className="fr-col-md-8 fr-col-lg-8 fr-col-sm-12">
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
