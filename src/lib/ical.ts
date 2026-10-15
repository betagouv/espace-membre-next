export interface CalEvent {
  type: "VEVENT";
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
}

export type CalendarResponse = Record<string, CalEvent>;

export interface ParseICSOptions {
  // Horizontal de génération pour les événements récurrents sans fin (UNTIL/COUNT).
  // Limite l'expansion infinie d'un événement récurrent.
  rrruleHorizon?: Date;
}

export const DEFAULT_RRULE_HORIZON_MS = 366 * 24 * 60 * 60 * 1000; // ~1 an

interface RRule {
  freq: string | undefined;
  interval: number;
  byday: string[];
  until?: Date;
  count?: number;
}

function unescapeValue(value: string): string {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\\\/g, "\\");
}

function parseICSDate(value: string): Date {
  const isUTC = value.endsWith("Z");
  const clean = value.replace("Z", "");

  if (clean.includes("T")) {
    const datePart = clean.substring(0, 8);
    const timePart = clean.substring(9);
    const year = parseInt(datePart.substring(0, 4), 10);
    const month = parseInt(datePart.substring(4, 6), 10) - 1;
    const day = parseInt(datePart.substring(6, 8), 10);
    const hour = parseInt(timePart.substring(0, 2), 10);
    const minute = parseInt(timePart.substring(2, 4), 10);
    const second = parseInt(timePart.substring(4, 6), 10);
    return isUTC
      ? new Date(Date.UTC(year, month, day, hour, minute, second))
      : new Date(year, month, day, hour, minute, second);
  }

  const year = parseInt(clean.substring(0, 4), 10);
  const month = parseInt(clean.substring(4, 6), 10) - 1;
  const day = parseInt(clean.substring(6, 8), 10);
  return new Date(year, month, day);
}

const DAY_OF_WEEK: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

function parseRRule(rrule: string): RRule {
  const parts: Record<string, string> = {};
  rrule.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx > 0) {
      parts[part.substring(0, idx).toUpperCase()] = part.substring(idx + 1);
    }
  });

  const interval = parseInt(parts["INTERVAL"] || "1", 10) || 1;
  const byday = (parts["BYDAY"] || "").split(",").filter(Boolean);

  return {
    freq: parts["FREQ"],
    interval,
    byday,
    until: parts["UNTIL"] ? parseICSDate(parts["UNTIL"]) : undefined,
    count: parts["COUNT"] ? parseInt(parts["COUNT"], 10) : undefined,
  };
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function setDayOfWeek(weekStart: Date, dayIndex: number): Date {
  const date = new Date(weekStart);
  const diff = dayIndex - weekStart.getDay();
  date.setDate(weekStart.getDate() + diff);
  return date;
}

// Génère les occurrences d'un événement récurrent. Seuls FREQ=WEEKLY (avec
// BYDAY et INTERVAL) sont gérés pour l'instant — le format utilisé par
// l'agenda public (Open-Xchange). L'expansion est bornée par UNTIL, COUNT ou
// l'horizon passé en paramètre pour éviter une boucle infinie.
function expandRecurrence(
  dtstart: Date,
  dtend: Date,
  rrule: RRule,
  horizon: Date,
): Array<{ start: Date; end: Date }> {
  if (!rrule.freq || (rrule.freq !== "WEEKLY" && rrule.freq !== "DAILY")) {
    return [{ start: dtstart, end: dtend }];
  }

  const duration = dtend.getTime() - dtstart.getTime();
  const occurrences: Array<{ start: Date; end: Date }> = [];
  const byday = rrule.byday.length > 0 ? rrule.byday : null;

  if (rrule.freq === "WEEKLY" && byday) {
    const dayIndices = byday
      .map((d) => DAY_OF_WEEK[d])
      .filter((d) => d !== undefined);
    if (dayIndices.length === 0) {
      return [{ start: dtstart, end: dtend }];
    }
    const weekStart = new Date(dtstart);
    weekStart.setHours(0, 0, 0, 0);
    const anchorDay = dtstart.getDay();

    for (let week = 0; ; week++) {
      const occurrenceWeekStart = new Date(weekStart);
      occurrenceWeekStart.setDate(
        weekStart.getDate() + week * 7 * rrule.interval,
      );

      let addedInWeek = false;
      for (const dayIndex of dayIndices) {
        const occurrenceStart = setDayOfWeek(occurrenceWeekStart, dayIndex);
        occurrenceStart.setHours(
          dtstart.getHours(),
          dtstart.getMinutes(),
          dtstart.getSeconds(),
          dtstart.getMilliseconds(),
        );

        if (rrule.count !== undefined && occurrences.length >= rrule.count) {
          return occurrences;
        }
        if (rrule.until && occurrenceStart.getTime() > rrule.until.getTime()) {
          return occurrences;
        }
        if (occurrenceStart.getTime() >= dtstart.getTime()) {
          if (occurrenceStart.getTime() > horizon.getTime()) {
            return occurrences;
          }
          occurrences.push({
            start: new Date(occurrenceStart),
            end: new Date(occurrenceStart.getTime() + duration),
          });
          addedInWeek = true;
        }
      }

      // Stoppe l'expansion si une semaine entière dépasse l'horizon
      const nextWeekStart = new Date(occurrenceWeekStart);
      nextWeekStart.setDate(occurrenceWeekStart.getDate() + 7 * rrule.interval);
      if (nextWeekStart.getTime() > horizon.getTime() && !addedInWeek) {
        return occurrences;
      }

      // Filet de sécurité anti boucle infinie
      if (week > 10000) {
        return occurrences;
      }
    }
  }

  if (rrule.freq === "DAILY") {
    for (let i = 0; ; i++) {
      if (rrule.count !== undefined && occurrences.length >= rrule.count) {
        return occurrences;
      }
      const occurrenceStart = new Date(dtstart);
      occurrenceStart.setDate(dtstart.getDate() + i * rrule.interval);
      if (rrule.until && occurrenceStart.getTime() > rrule.until.getTime()) {
        return occurrences;
      }
      if (occurrenceStart.getTime() > horizon.getTime()) {
        return occurrences;
      }
      if (i === 0 || !sameDay(occurrenceStart, dtstart)) {
        occurrences.push({
          start: new Date(occurrenceStart),
          end: new Date(occurrenceStart.getTime() + duration),
        });
      }
    }
  }

  return [{ start: dtstart, end: dtend }];
}

export function parseICS(
  icsText: string,
  options?: ParseICSOptions,
): CalendarResponse {
  const unfolded = icsText.replace(/\r?\n[ \t]/g, "");
  const lines = unfolded.split(/\r?\n/);

  const result: CalendarResponse = {};
  let current: Record<string, string> | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = {};
    } else if (line === "END:VEVENT" && current !== null) {
      const uid = current["UID"] || `event-${Object.keys(result).length}`;
      const dtstart = parseICSDate(current["DTSTART"] ?? "");
      const dtend = parseICSDate(current["DTEND"] ?? "");
      const baseEvent: CalEvent = {
        type: "VEVENT",
        uid,
        summary: unescapeValue(current["SUMMARY"] ?? ""),
        description: current["DESCRIPTION"]
          ? unescapeValue(current["DESCRIPTION"])
          : undefined,
        location: current["LOCATION"]
          ? unescapeValue(current["LOCATION"])
          : undefined,
        start: dtstart,
        end: dtend,
      };

      if (current["RRULE"]) {
        const horizon =
          options?.rrruleHorizon ||
          new Date(dtstart.getTime() + DEFAULT_RRULE_HORIZON_MS);
        const occurrences = expandRecurrence(
          dtstart,
          dtend,
          parseRRule(current["RRULE"]),
          horizon,
        );
        occurrences.forEach((occurrence, index) => {
          result[index === 0 ? uid : `${uid}#${index}`] = {
            ...baseEvent,
            start: occurrence.start,
            end: occurrence.end,
          };
        });
      } else {
        result[uid] = baseEvent;
      }
      current = null;
    } else if (current !== null) {
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0) {
        const propName = line.substring(0, colonIdx).split(";")[0];
        const value = line.substring(colonIdx + 1);
        current[propName] = value;
      }
    }
  }

  return result;
}
