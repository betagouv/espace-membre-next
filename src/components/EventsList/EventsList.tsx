import { fr } from "@codegouvfr/react-dsfr";
import Card from "@codegouvfr/react-dsfr/Card";
import { format } from "date-fns";
import { fr as frLocale } from "date-fns/locale/fr";
import MarkdownIt from "markdown-it";
import { CalendarComponent, CalendarResponse, ParameterValue, VEvent } from "node-ical";
import "./EventsList.css";

function isVEvent(event: CalendarComponent | undefined): event is VEvent {
  return !!event && event.type === "VEVENT";
}

function paramStr(val: ParameterValue | undefined): string {
  if (!val) return "";
  return typeof val === "string" ? val : val.val;
}

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

export function EventsList({ events }: { events: CalendarResponse }) {
  const href = "";
  const excludedKeywords = [
    "formation",
    "atelier",
    "embarquement",
    "tester l'accessibilité",
    "coacher l'accessibilité",
  ];
  const sortedEvents = (
    Object.entries(events) as [string, CalendarComponent | undefined][]
  )
    .filter((entry): entry is [string, VEvent] => isVEvent(entry[1]))
    .filter(
      ([key, event]) =>
        event.start >= new Date() &&
        !excludedKeywords.some((keyword) =>
          paramStr(event.summary).toLowerCase().includes(keyword.toLowerCase()),
        ),
    )
    .sort(
      ([, event1], [, event2]) =>
        event1.start.getTime() - event2.start.getTime(),
    );

  return (
    <div
      id="events-list"
      className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}
    >
      {sortedEvents.map(([key, event]) => {
        return (
          <Card
            key={key}
            className={fr.cx("fr-col-10", "fr-col-offset-1", "fr-mb-2w")}
            desc={
              <span
                style={{
                  overflowWrap: "break-word",
                  whiteSpace: "break-spaces",
                }}
                dangerouslySetInnerHTML={{
                  __html: mdParser.renderInline(paramStr(event.description)),
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
            title={paramStr(event.summary)}
            titleAs="h2"
            endDetail={
              event.location ? (
                <span
                  style={{
                    overflowWrap: "break-word",
                    whiteSpace: "break-spaces",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: `📍 ${mdParser.renderInline(paramStr(event.location))}`,
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
