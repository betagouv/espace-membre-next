import { expect } from "chai";

import { parseICS } from "./ical";

const weeklyNoEnd = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:weekly-1
DTSTART;TZID=Europe/Paris:20260602T140000
DTEND;TZID=Europe/Paris:20260602T150000
SUMMARY:Tech stream hebdo
RRULE:FREQ=WEEKLY;BYDAY=TU
END:VEVENT
END:VCALENDAR`;

const biweeklyByDay = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:biweekly-1
DTSTART;TZID=Europe/Paris:20260622T140000
DTEND;TZID=Europe/Paris:20260622T143000
SUMMARY:Qu'est-ce qu'IA
RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO
END:VEVENT
END:VCALENDAR`;

const singleEvent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:single-1
DTSTART:20260914T121500Z
DTEND:20260914T131500Z
SUMMARY:Embarquement Dev
END:VEVENT
END:VCALENDAR`;

const untilRule = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:until-1
DTSTART;TZID=Europe/Paris:20260602T140000
DTEND;TZID=Europe/Paris:20260602T150000
SUMMARY:Until event
RRULE:FREQ=WEEKLY;BYDAY=TU;UNTIL=20260616T140000Z
END:VEVENT
END:VCALENDAR`;

describe("parseICS", () => {
  it("parses a single non-recurring event", () => {
    const result = parseICS(singleEvent);
    const event = result["single-1"];
    expect(Object.keys(result)).to.have.length(1);
    expect(event.summary).to.equal("Embarquement Dev");
    expect(event.start.toISOString()).to.equal("2026-09-14T12:15:00.000Z");
    expect(event.end.toISOString()).to.equal("2026-09-14T13:15:00.000Z");
  });

  it("expands a weekly recurring event without end within the horizon", () => {
    const result = parseICS(weeklyNoEnd);
    // Une occurrence par semaine sur ~1 an
    expect(Object.keys(result).length).to.be.greaterThan(40);
    const keys = Object.keys(result).sort();
    // La première occurrence est le DTSTART (uid sans suffixe)
    expect(result["weekly-1"]).to.exist;
    expect(result["weekly-1"].start.toISOString()).to.equal(
      "2026-06-02T12:00:00.000Z",
    );
    // Les occurrences suivantes sont espacées de 7 jours, même heure locale,
    // et tombent toutes un mardi.
    let previous: Date | null = null;
    Object.values(result)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .forEach((event) => {
        expect(event.start.getDay()).to.equal(2); // mardi
        expect(event.start.getHours()).to.equal(14); // 14h heure de Paris
        if (previous) {
          // 7 jours calendaires (l'écart ms peut varier de ±1h si un
          // changement d'heure DST se produit entre deux occurrences).
          const dayDiff = Math.round(
            (event.start.getTime() - previous.getTime()) /
              (24 * 60 * 60 * 1000),
          );
          expect(dayDiff).to.equal(7);
        }
        previous = event.start;
      });
  });

  it("respects UNTIL for recurring events", () => {
    const result = parseICS(untilRule);
    // 2026-06-02, 06-09, 06-16 => 3 occurrences
    expect(Object.keys(result)).to.have.length(3);
  });

  it("respects INTERVAL for recurring events", () => {
    const result = parseICS(biweeklyByDay);
    const occurrences = Object.values(result).sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    );
    expect(occurrences.length).to.be.greaterThan(10);
    let previous: Date | null = null;
    occurrences.forEach((event) => {
      expect(event.start.getDay()).to.equal(1); // lundi
      if (previous) {
        // Deux semaines calendaires (INTERVAL=2), ±1h si DST entre les deux.
        const dayDiff = Math.round(
          (event.start.getTime() - previous.getTime()) /
            (24 * 60 * 60 * 1000),
        );
        expect(dayDiff).to.equal(14);
      }
      previous = event.start;
    });
    expect(occurrences[0].start.getDate()).to.equal(22); // 22/06/2026
  });

  it("stops expansion at a custom horizon", () => {
    const result = parseICS(weeklyNoEnd, {
      rrruleHorizon: new Date("2026-06-16T00:00:00Z"),
    });
    // 2026-06-02 et 2026-06-09 uniquement
    expect(Object.keys(result)).to.have.length(2);
  });
});
