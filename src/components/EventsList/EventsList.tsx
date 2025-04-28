import { fr } from "@codegouvfr/react-dsfr";
import Card from "@codegouvfr/react-dsfr/Card";
import { format } from "date-fns";
import { fr as frLocale } from "date-fns/locale/fr";
import MarkdownIt from "markdown-it";
import { CalendarResponse } from "node-ical";
import "./EventsList.css";

const mdParser = new MarkdownIt({
    html: true,
    linkify: true,
    highlight: function (str) { 
        console.log(str)
        return '';
    }

});

mdParser.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    tokens[idx].attrPush(["class", "fr-link--sm"]); // Add class
    tokens[idx].attrPush(["target", "_blank"]); // Add class
    return self.renderToken(tokens, idx, options);
};

export function EventsList({ events }: { events: CalendarResponse }) {
    const href = "";
    const excludedKeywords = [
        "formation",
        "atelier",
        "embarquement",
        "tester l'accessibilité",
        "coacher l'accessibilité",
    ];
    const sortedEvents = Object.entries(events)
        .filter(
            ([key, event]) =>
                event.type === "VEVENT" && event.start >= new Date()
        )
        .filter(
            ([key, event]) =>
                event.type === "VEVENT" &&
                !excludedKeywords.some(keyword => event.summary.toLowerCase().includes(keyword.toLowerCase()))
        )
        .sort(
            ([key1, event1], [key2, event2]) =>
                (event1.type === "VEVENT" &&
                    event2.type === "VEVENT" &&
                    event1.start.getTime() - event2.start.getTime()) ||
                0
        );

    return (
        <div id="events-list" className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
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
                                    __html: mdParser.renderInline(event.description || ""),
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
                                        __html: `📍 ${mdParser.renderInline(event.location || "")}`,
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
