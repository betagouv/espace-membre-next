import React, { useState, useEffect } from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { format } from "date-fns";
import { fr as frDateFns } from "date-fns/locale";

import { EventActionFromDB, EventCodeToReadable } from "@/models/actionEvent";
import {
    matomoInfoDataSchema,
    matomoInfoDataSchemaType,
} from "@/models/matomoInfo";

const MemberEventList = ({ userId }) => {
    const [matomoInfo, setMatomoInfo] = useState<matomoInfoDataSchemaType>();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchMatomoInfo = async () => {
            if (!userId) return;

            setLoading(true);
            try {
                const response = await fetch(
                    `/api/member/${userId}/matomo-user`
                );
                console.log(response);
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                const data = await response.json();
                setMatomoInfo(matomoInfoDataSchema.parse(data));
            } catch (error) {
                console.error("Failed to fetch matomoInfo:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMatomoInfo();
    }, [userId]);
    if (!matomoInfo?.primaryEmail && !matomoInfo?.secondaryEmail)
        return <div>Pas d'information trouver sur un compte matomo</div>;
    return (
        <div>
            {matomoInfo.primaryEmail && (
                <li>
                    Compte matomo avec {matomoInfo.primaryEmail.email}
                    <br />
                    2FA: {matomoInfo.primaryEmail.uses_2fa ? "true" : "false"}
                </li>
            )}
            {matomoInfo.secondaryEmail && (
                <li>
                    Compte matomo avec {matomoInfo.secondaryEmail.email}
                    <br />
                    2FA: {matomoInfo.secondaryEmail.uses_2fa ? "true" : "false"}
                </li>
            )}
        </div>
    );
};

export default MemberEventList;
