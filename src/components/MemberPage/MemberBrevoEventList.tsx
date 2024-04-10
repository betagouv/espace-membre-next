import React, { useState, useEffect } from "react";

import { Table } from "@codegouvfr/react-dsfr/Table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { z } from "zod";

const emailEventSchema = z.object({
    email: z.string().email(),
    _date: z.string(),
    messageId: z.string(),
    event: z.string(),
    subject: z.string(),
    tag: z.string().optional(), // Assuming tag can be an empty string or optional
    ip: z.string(),
    from: z.string(),
});

type emailEventSchemaType = z.infer<typeof emailEventSchema>;

const EmailEventsTable = ({ data }) => {
    // Helper function to render table rows for each event

    const eventRows = (events: emailEventSchemaType[]) => {
        return events
            .sort(
                (a, b) =>
                    new Date(b._date).getTime() - new Date(a._date).getTime()
            )
            .map((event, index) => {
                return [
                    event.email,
                    format(event._date, "dd/MM/yyyy 'à' HH:mm", { locale: fr }),
                    event.event,
                    event.subject,
                    event.tag,
                    event.from,
                ];
            });
    };

    return (
        <div>
            <h2>Brevo Events</h2>
            <Table
                headers={["Email", "Date", "Event", "Subject", "Tag", "From"]}
                data={eventRows([
                    ...(data.secondary_email.events || []),
                    ...(data.primary_email.events || []),
                ])}
            ></Table>
        </div>
    );
};

const MemberBrevoEventList = ({ userId }) => {
    const [eventData, setEventData] = useState();
    const [loading, setLoading] = useState(false);

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
                setEventData(data);
            } catch (error) {
                console.error("Failed to fetch events:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [userId]);

    if (loading) return <div>Loading...</div>;
    if (!eventData) return <div>No events found for this user.</div>;

    return (
        <div>
            <EmailEventsTable data={eventData} />
        </div>
    );
};

export default MemberBrevoEventList;
