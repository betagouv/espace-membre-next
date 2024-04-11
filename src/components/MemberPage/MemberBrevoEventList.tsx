import React, { useState, useEffect } from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { format } from "date-fns";
import { fr as frFns } from "date-fns/locale";
import { z } from "zod";

import {
    brevoEmailEventDataSchema,
    brevoEmailEventDataSchemaType,
    brevoEmailEventSchemaType,
} from "@/models/brevoEvent";

const EmailEventsTable = ({ data }) => {
    // Helper function to render table rows for each event

    const eventRows = (events: brevoEmailEventSchemaType[]) => {
        return events
            .sort(
                (a, b) =>
                    new Date(b._date).getTime() - new Date(a._date).getTime()
            )
            .map((event, index) => {
                return [
                    event.email,
                    format(event._date, "dd/MM/yyyy 'à' HH:mm", {
                        locale: frFns,
                    }),
                    event.event,
                    event.subject,
                    event.tag,
                    event.from,
                ];
            });
    };

    return (
        <Table
            headers={["Email", "Date", "Event", "Subject", "Tag", "From"]}
            data={eventRows([
                ...(data.secondary_email.events || []),
                ...(data.primary_email.events || []),
            ])}
        ></Table>
    );
};

const MemberBrevoEventList = ({ userId }) => {
    const [eventData, setEventData] = useState<brevoEmailEventDataSchemaType>();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            if (!userId) return;

            setLoading(true);
            try {
                const response = await fetch(
                    `/api/member/${userId}/brevo-events`
                );
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                const data = await response.json();
                setEventData(brevoEmailEventDataSchema.parse(data));
            } catch (error) {
                console.error("Failed to fetch events:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [userId]);
    let content;
    if (loading) {
        content = <div>Loading...</div>;
    } else {
        content = (
            <div>
                <EmailEventsTable data={eventData} />
            </div>
        );
    }
    return <Accordion label="Événements Brevo">{content}</Accordion>;
};

export default MemberBrevoEventList;
