import { routeTitles } from "@/lib/routes";
import { fr } from "@codegouvfr/react-dsfr";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { parseICS } from "@/lib/ical";

import { EventsList } from "@/components/EventsList/EventsList";
import { authOptions } from "@/lib/authoptions";
import config from "@/lib/config";

export const metadata: Metadata = {
  title: `${routeTitles.eventsList()} / Espace Membre`,
};

const fetchCalendar = (url) => {
  return fetch(url, { next: { revalidate: 60 * 60 } }) // cache 1 hour
    .then((r) => r.text())
    .then((r) => parseICS(r));
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  const events = await fetchCalendar(config.CALENDAR_PUBLIC_URL);

  if (!session) {
    redirect("/login");
  }
  return (
    <div className="fr-container fr-container--fluid">
      <h1 className={fr.cx("fr-mb-6w")}>
        {routeTitles.eventsList()}{" "}
        <span style={{ fontSize: "1rem" }}>
          {config.CALENDAR_PUBLIC_URL && (
            <Link
              className={fr.cx("fr-ml-2w")}
              href={config.CALENDAR_PUBLIC_URL}
              target="_blank"
              title="Lien vers l'agenda public - ouvre une nouvelle fenêtre"
            >
              <span className={fr.cx("fr-icon-calendar-2-line")}></span>
              Lien vers l'agenda public
            </Link>
          )}
        </span>
      </h1>
      <EventsList events={events}></EventsList>
    </div>
  );
}
