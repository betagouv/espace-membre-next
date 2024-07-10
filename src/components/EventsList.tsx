import { fr } from "@codegouvfr/react-dsfr";
import Card from "@codegouvfr/react-dsfr/Card";
import { format } from "date-fns";
import { fr as frLocale } from "date-fns/locale/fr";
import { CalendarResponse } from "node-ical";

function htmlize(str = "") {
    return str
        .replace(/^(https:\/\/[^\s\n]+)/g, `<a href="$1">$1</a>`)
        .replace(/[^="'](https:\/\/[^\s\n]+)/g, `<a href="$1">$1</a>`);
}

export function EventsList({ events }: { events: CalendarResponse }) {
    const href = "";
    const sortedEvents = Object.entries(events)
        .filter(
            ([key, event]) =>
                event.type === "VEVENT" && event.start >= new Date()
        )
        .sort(
            ([key1, event1], [key2, event2]) =>
                (event1.type === "VEVENT" &&
                    event2.type === "VEVENT" &&
                    event1.start.getTime() - event2.start.getTime()) ||
                0
        );

    return (
        <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
            {sortedEvents.map(([key, event]) => {
                if (event.type !== "VEVENT") {
                    return null;
                }
                return (
                    <Card
                        key={key}
                        className={fr.cx(
                            "fr-col-10",
                            "fr-col-offset-1",
                            "fr-mb-2w"
                        )}
                        desc={
                            <span
                                style={{
                                    overflowWrap: "break-word",
                                    whiteSpace: "break-spaces",
                                }}
                                dangerouslySetInnerHTML={{
                                    __html: htmlize(event.description),
                                }}
                            />
                        }
                        start={
                            <div className={fr.cx("fr-mb-2w", "fr-text--bold")}>
                                🗓️{" "}
                                {format(event.start, "PPPp", {
                                    locale: frLocale,
                                })}
                            </div>
                        }
                        size="medium"
                        title={event.summary}
                        titleAs="h2"
                        endDetail={
                            event.location ? (
                                <span
                                    style={{
                                        overflowWrap: "break-word",
                                        whiteSpace: "break-spaces",
                                    }}
                                    dangerouslySetInnerHTML={{
                                        __html: `📍 ${htmlize(event.location)}`,
                                    }}
                                />
                            ) : null
                        }
                    ></Card>
                );
            })}
        </div>
    );
}
