import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { routeTitles } from "@/utils/routes/routeTitles";
import { getSessionFromStore } from "@/server/middlewares/sessionMiddleware";
import { cookies } from "next/headers";
import config from "@/server/config";
import Card from "@codegouvfr/react-dsfr/Card";
import Button from "@codegouvfr/react-dsfr/Button";
import {
    durationBetweenDate,
    formatDateToFrenchTextReadableFormat,
} from "@/utils/date";
import { fetchAirtableFormationById } from "@/lib/airtable";
import { format } from "date-fns/format";
import { fr } from "date-fns/locale/fr";

export const metadata: Metadata = {
    title: `${routeTitles.accountEditBaseInfo()} / Espace Membre`,
};

type Props = {
    params: { id: string };
};

export default async function Page({ params }: Props) {
    const cookieStore = cookies();
    const session = (await getSessionFromStore(
        cookieStore.get(config.SESSION_COOKIE_NAME)
    )) as { id: string };
    if (!session) {
        redirect("/login");
    }
    const formation = await fetchAirtableFormationById(params.id);

    return (
        <div className="fr-container--fluid">
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
                                <p>Animateur : {formation.animatorEmail}</p>
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
                                    formation.availableSeats !== undefined && (
                                        <p>
                                            Inscription: {}
                                            {formation.availableSeats > 0
                                                ? formation.maxSeats -
                                                  formation.availableSeats
                                                : formation.maxSeats}
                                            /{formation.maxSeats}
                                        </p>
                                    )}
                                <Button
                                    linkProps={{
                                        href: formation.inscriptionLink,
                                    }}
                                >
                                    {formation.availableSeats <= 0
                                        ? `M'inscrire sur liste d'attente`
                                        : `M'inscrire`}
                                </Button>
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
            <a
                href="/formations"
                className="fr-link fr-link--lg fr-link--icon-left fr-icon-arrow-left-line"
            >
                Voir toutes les formations
            </a>
        </div>
    );
}
