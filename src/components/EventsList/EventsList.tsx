"use client";

import { useMemo, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import Card from "@codegouvfr/react-dsfr/Card";
import Button from "@codegouvfr/react-dsfr/Button";
import { format } from "date-fns";
import { fr as frLocale } from "date-fns/locale/fr";
import MarkdownIt from "markdown-it";
import { CalendarResponse } from "@/lib/ical";

// @ts-ignore
import "./EventsList.css";

const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  highlight: function (str) {
    console.log(str);
    return "";
  },
});

mdParser.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  tokens[idx].attrPush(["class", "fr-link--sm"]); // Add class
  tokens[idx].attrPush(["target", "_blank"]); // Add class
  return self.renderToken(tokens, idx, options);
};

const INITIAL_EVENTS_COUNT = 20;
const excludedKeywords = [
  "formation",
  "atelier",
  "tester l'accessibilité",
  "coacher l'accessibilité",
];

// Pour les événements récurrents, ne conserver que les 3 prochaines occurrences.
// Les occurrences issues de l'expansion de la récurrence partagent le même UID
// de base (format `uid` / `uid#1` / `uid#2` …).
const MAX_RECURRING_OCCURRENCES = 3;

function getBaseUid(uid: string): string {
  return uid.split("#")[0];
}

export function EventsList({ events }: { events: CalendarResponse }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_EVENTS_COUNT);
  const href = "";
  const upcomingEvents = useMemo(
    () =>
      Object.values(events).filter(
        (event) =>
          event &&
          event.type === "VEVENT" &&
          event.start >= new Date() &&
          !excludedKeywords.some((keyword) =>
            event.summary
              .toString()
              .toLowerCase()
              .includes(keyword.toLowerCase()),
          ),
      ),
    [events],
  );

  const sortedEvents = useMemo(() => {
    const upcomingByBase = new Map<string, typeof upcomingEvents>();
    for (const event of upcomingEvents) {
      const baseUid = getBaseUid(event.uid);
      const serie = upcomingByBase.get(baseUid);
      if (serie) {
        serie.push(event);
      } else {
        upcomingByBase.set(baseUid, [event]);
      }
    }

    return Array.from(upcomingByBase.entries())
      .flatMap(([, serie]) =>
        serie
          .sort((a, b) => a.start.getTime() - b.start.getTime())
          .slice(0, MAX_RECURRING_OCCURRENCES),
      )
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [upcomingEvents]);

  const visibleEvents = sortedEvents.slice(0, visibleCount);

  return (
    <div
      id="events-list"
      className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}
    >
      {visibleEvents.map((event) => {
        if (event && event.type !== "VEVENT") {
          return null;
        }
        if (!event) return null;
        return (
          <Card
            key={event.uid}
            className={fr.cx("fr-col-10", "fr-col-offset-1", "fr-mb-2w")}
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
            title={event.summary.toString()}
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
      {sortedEvents.length > visibleCount && (
        <div
          className={fr.cx("fr-col-10", "fr-col-offset-1", "fr-mt-2w")}
          style={{ textAlign: "center" }}
        >
          <Button
            priority="secondary"
            onClick={() =>
              setVisibleCount((count) => count + INITIAL_EVENTS_COUNT)
            }
          >
            Voir plus d&apos;événements
          </Button>
        </div>
      )}
    </div>
  );
}
