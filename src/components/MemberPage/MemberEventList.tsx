// components/MemberEventList.js

import React, { useState, useEffect } from "react";

import { ActionEvent, EventCodeToReadable } from "@/models/actionEvent";

const MemberEventList = ({ userId }) => {
    const [events, setEvents] = useState<ActionEvent[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            if (!userId) return;

            setLoading(true);
            try {
                const response = await fetch(`/api/member/${userId}/events`);
                console.log(response);
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                const data: ActionEvent[] = await response.json();
                setEvents(data);
            } catch (error) {
                console.error("Failed to fetch events:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [userId]);

    if (loading) return <div>Loading...</div>;
    if (!events.length) return <div>No events found for this user.</div>;

    return (
        <div>
            <h2>User Events</h2>
            <ul>
                {events.map((event, key) => (
                    <li key={key}>
                        {EventCodeToReadable[event.action_code]} par{" "}
                        {event.created_by_username}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default MemberEventList;
