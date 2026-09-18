"use client";

import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { formatInTimeZone } from "date-fns-tz";
import { fr as frLocale } from "date-fns/locale/fr";

import { FormationRegisterButton } from "@/components/Formation/FormationRegisterButton";
import { libelleInscriptions } from "@/lib/formationSeats";
import { GristInscription } from "@/lib/formationsGrist";

export type FormationDate = {
  id: string;
  start?: Date;
  maxSeats?: number;
  availableSeats?: number;
  inscrits?: number;
};

/**
 * Dates d'une formation autres que la plus proche.
 *
 * Une formation peut être programmée plusieurs fois : sans cette liste, seule
 * la date la plus proche serait ouverte aux inscriptions, et les suivantes
 * n'apparaîtraient qu'une fois celle-là passée.
 *
 * Chaque date porte son propre bouton : ce sont des sessions distinctes, avec
 * leurs places et leur liste d'attente.
 */
export const FormationOtherDates = ({
  sessions,
  inscriptions,
  isAnimator,
}: {
  sessions: FormationDate[];
  inscriptions: GristInscription[];
  isAnimator: boolean;
}) => {
  if (sessions.length === 0) return null;

  return (
    <div className={fr.cx("fr-mt-4w")}>
      <h2 className={fr.cx("fr-h5")}>Autres sessions</h2>
      <ul
        className={fr.cx("fr-mb-0")}
        style={{ listStyle: "none", padding: 0 }}
      >
        {sessions.map((session) => {
          const inscription = inscriptions.find(
            (i) => i.sessionId === session.id,
          );
          const seatsLeft = session.availableSeats ?? 0;
          // Sans limite, `availableSeats` vaut la capacité, soit zéro : le
          // décompte vient alors de la liste des participants.
          const taken = session.maxSeats
            ? Math.max(0, session.maxSeats - seatsLeft)
            : (session.inscrits ?? 0);

          return (
            <li
              key={session.id}
              className={fr.cx("fr-py-2w")}
              style={{
                display: "flex",
                gap: "1rem",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                borderTop: "1px solid var(--border-default-grey)",
              }}
            >
              <span>
                <strong>
                  {session.start
                    ? // Fuseau explicite : le serveur tourne en UTC, le
                      // navigateur à Paris.
                      formatInTimeZone(
                        session.start,
                        "Europe/Paris",
                        "EEEE d MMMM yyyy à HH'h'mm",
                        { locale: frLocale },
                      )
                    : "Date à préciser"}
                </strong>
                <span className={fr.cx("fr-hint-text")}>
                  {session.maxSeats
                    ? `Inscription : ${libelleInscriptions(taken, session.maxSeats)}`
                    : libelleInscriptions(taken)}
                </span>
              </span>
              <FormationRegisterButton
                sessionId={session.id}
                isRegistered={!!inscription}
                isOnWaitingList={!!inscription?.onWaitingList}
                seatsLeft={seatsLeft}
                isAnimator={isAnimator}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};
