import { fr } from "@codegouvfr/react-dsfr";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import ical from "node-ical";

import { EventsList } from "@/components/EventsList";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.eventsList()} / Espace Membre`,
};

const calendarUrl =
    "https://calendar.google.com/calendar/ical/0ieonqap1r5jeal5ugeuhoovlg%40group.calendar.google.com/public/basic.ics";

const fetchCalendar = (url) => {
    return fetch(url)
        .then((r) => r.text())
        .then((r) => ical.parseICS(r));
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
                        href="https://calendar.google.com/calendar/ical/0ieonqap1r5jeal5ugeuhoovlg%40group.calendar.google.com/public/basic.ics"
                        target="_blank"
                        title="Fichier iCal de l'agenda public - ouvre une nouvelle fenêtre"
                    >
                        <span className={fr.cx("fr-icon-download-line")}></span>
                        Lien vers le fichier iCal
                    </Link>
                    <Link
                        className={fr.cx("fr-ml-2w")}
                        href="https://calendar.google.com/calendar/embed?src=0ieonqap1r5jeal5ugeuhoovlg%40group.calendar.google.com&ctz=Europe%2FParis"
                        target="_blank"
                        title="Lien vers l'agenda public - ouvre une nouvelle fenêtre"
                    >
                        <span
                            className={fr.cx("fr-icon-calendar-2-line")}
                        ></span>
                        Lien vers l'agenda public
                    </Link>
                </span>
            </h1>
            <EventsList events={events}></EventsList>
        </div>
    );
}
