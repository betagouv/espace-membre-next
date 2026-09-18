import { routeTitles } from "@/lib/routes";
import { fr } from "@codegouvfr/react-dsfr";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { parseICS } from "@/lib/ical";

import { EventsList } from "@/components/EventsList/EventsList";
import { authOptions } from "@/lib/authoptions";


export const metadata: Metadata = {
  title: `${routeTitles.eventsList()} / Espace Membre`,
};

const calendarUrl =
  "https://messagerie.numerique.gouv.fr/appsuite/api/share/0366722a002da2b9366722802da84e5eb694970c9c989a65/1/2/Y2FsOi8vMC8yMjczNA";

const fetchCalendar = (url) => {
  return fetch(url)
    .then((r) => r.text())
    .then((r) => parseICS(r));
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  const events = await fetchCalendar(calendarUrl);

  if (!session) {
    redirect("/login");
  }
  return (
    <div className="fr-container fr-container--fluid">
      <h1 className={fr.cx("fr-mb-6w")}>
        {routeTitles.eventsList()}{" "}
        <span style={{ fontSize: "1rem" }}>
          <Link
            className={fr.cx("fr-ml-2w")}
            href="https://messagerie.numerique.gouv.fr/appsuite/api/share/0366722a002da2b9366722802da84e5eb694970c9c989a65/1/2/Y2FsOi8vMC8yMjczNA"
            target="_blank"
            title="Lien vers l'agenda public - ouvre une nouvelle fenêtre"
          >
            <span className={fr.cx("fr-icon-calendar-2-line")}></span>
            Lien vers l'agenda public
          </Link>
        </span>
      </h1>
      <EventsList events={events}></EventsList>
    </div>
  );
}
