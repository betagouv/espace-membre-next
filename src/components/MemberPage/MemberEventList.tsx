import React, { useState, useEffect } from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { format } from "date-fns";
import { fr as frDateFns } from "date-fns/locale";

import {
    EventActionFromDB,
    EventCodeToReadable,
} from "@/models/actionEvent/actionEvent";

const MemberEventList = ({ userId }) => {
    const [events, setEvents] = useState<EventActionFromDB[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            if (!userId) return;

            setLoading(true);
            try {
                const response = await fetch(`/api/member/${userId}/events`);
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                const data: EventActionFromDB[] = await response.json();
                setEvents(data);
            } catch (error) {
                console.error("Failed to fetch events:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [userId]);
    let content;
    if (loading || !events) {
        content = <div>Loading...</div>;
    } else if (!events.length) {
        content = <div>No events found for this user.</div>;
    } else {
        content = (
            <Table
                data={events.map((event) => [
                    EventCodeToReadable[event.action_code],
                    format(event.created_at, "dd/MM/yyyy 'à' HH:mm", {
                        locale: frDateFns,
                    }),
                    event.created_by_username,
                    <div
                        className={fr.cx("fr-accordions-group")}
                        key={event.id}
                    >
                        {!!(event["action_metadata"] || {}).value && (
                            <Accordion label="Nouvelle valeur">
                                <pre>
                                    {JSON.stringify(
                                        (event["action_metadata"] || {})
                                            .value || {},
                                        null,
                                        2,
                                    )}
                                </pre>
                            </Accordion>
                        )}
                        {!!(event["action_metadata"] || {}).old_value && (
                            <Accordion label="Valeur précédente">
                                <pre>
                                    {JSON.stringify(
                                        (event["action_metadata"] || {})
                                            .old_value || {},
                                        null,
                                        2,
                                    )}
                                </pre>
                            </Accordion>
                        )}
                    </div>,
                ])}
                headers={[
                    `Nom de l'action`,
                    `Date`,
                    `Action faite par`,
                    `Données`,
                ]}
            ></Table>
        );
    }
    return <Accordion label="Événements Espace-Membre">{content}</Accordion>;
};

export default MemberEventList;
