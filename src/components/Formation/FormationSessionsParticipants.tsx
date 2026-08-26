"use client";

import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { formatInTimeZone } from "date-fns-tz";
import { fr as frLocale } from "date-fns/locale/fr";
import Link from "next/link";

import { FormationSessionEditForm } from "@/components/Formation/FormationSessionEditForm";
import { GristParticipant } from "@/lib/formationsGrist";

export type ParticipantAvecFiche = GristParticipant & { profileUrl?: string };

export type SessionAvecParticipants = {
  id: string;
  start?: Date;
  maxSeats?: number;
  dureeHeures?: number;
  lienVisioAdmin?: string;
};

/**
 * Dates d'une formation, chacune dépliable sur ses participants.
 *
 * Une formation peut être programmée dix fois : une liste unique mélangerait
 * les inscrits de toutes les dates. Chaque date porte donc sa propre liste,
 * repliée par défaut — sauf s'il n'y en a qu'une, où replier n'aurait aucun
 * intérêt.
 */
export const FormationSessionsParticipants = ({
  sessions,
  participantsBySession,
}: {
  sessions: SessionAvecParticipants[];
  participantsBySession: Record<string, ParticipantAvecFiche[]>;
}) => {
  const [ouvertes, setOuvertes] = React.useState<string[]>(
    sessions.length === 1 ? [sessions[0].id] : [],
  );
  const [enEdition, setEnEdition] = React.useState<string | null>(null);

  const bascule = (id: string) =>
    setOuvertes((actuelles) =>
      actuelles.includes(id)
        ? actuelles.filter((autre) => autre !== id)
        : [...actuelles, id],
    );

  if (sessions.length === 0) {
    return <p className={fr.cx("fr-hint-text")}>Aucune date à venir.</p>;
  }

  return (
    <ul className={fr.cx("fr-mb-0")} style={{ listStyle: "none", padding: 0 }}>
      {sessions.map((session) => {
        const participants = participantsBySession[session.id] ?? [];
        const inscrits = participants.filter((p) => !p.onWaitingList);
        const enAttente = participants.filter((p) => p.onWaitingList);
        const ouverte = ouvertes.includes(session.id);

        return (
          <li
            key={session.id}
            style={{ borderTop: "1px solid var(--border-default-grey)" }}
          >
            <button
              type="button"
              aria-expanded={ouverte}
              onClick={() => bascule(session.id)}
              className={fr.cx(
                "fr-btn",
                "fr-btn--tertiary-no-outline",
                ouverte
                  ? "fr-icon-arrow-up-s-line"
                  : "fr-icon-arrow-down-s-line",
                "fr-btn--icon-left",
              )}
              style={{ width: "100%", justifyContent: "flex-start" }}
            >
              {session.start
                ? // Fuseau explicite : le serveur tourne en UTC, le navigateur
                  // à Paris.
                  formatInTimeZone(
                    session.start,
                    "Europe/Paris",
                    "EEEE d MMMM yyyy à HH'h'mm",
                    { locale: frLocale },
                  )
                : "Date à préciser"}
              {" — "}
              {inscrits.length}
              {session.maxSeats ? `/${session.maxSeats}` : ""} inscrit·es
              {enAttente.length ? ` + ${enAttente.length} en attente` : ""}
            </button>

            {ouverte && (
              <div className={fr.cx("fr-px-3w", "fr-pb-2w")}>
                {enEdition === session.id ? (
                  <FormationSessionEditForm
                    sessionId={session.id}
                    start={session.start}
                    dureeHeures={session.dureeHeures}
                    capacite={session.maxSeats}
                    lienVisioAdmin={session.lienVisioAdmin}
                    onDone={() => setEnEdition(null)}
                  />
                ) : (
                  <Button
                    className={fr.cx("fr-mb-2w")}
                    priority="secondary"
                    size="small"
                    nativeButtonProps={{ type: "button" }}
                    onClick={() => setEnEdition(session.id)}
                  >
                    Modifier cette date
                  </Button>
                )}
                {participants.length === 0 ? (
                  <p className={fr.cx("fr-hint-text", "fr-mb-0")}>
                    Personne inscrit·e à cette date.
                  </p>
                ) : (
                  <ul className={fr.cx("fr-mb-0")}>
                    {participants.map((participant, index) => (
                      <li key={`${participant.email}-${index}`}>
                        {participant.profileUrl ? (
                          <Link href={participant.profileUrl}>
                            {participant.name}
                          </Link>
                        ) : (
                          participant.name
                        )}
                        {participant.email ? ` — ${participant.email}` : ""}{" "}
                        {participant.onWaitingList && (
                          <Badge as="span" small>
                            liste d&apos;attente
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};
