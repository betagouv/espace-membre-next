import { CSSProperties } from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { format } from "date-fns";
import { fr as frLocale } from "date-fns/locale/fr";
import Link from "next/link";

import { PrivateMemberChangeSchemaType } from "@/models/memberChange";
import { StartupChangeSchemaType } from "@/models/startupChange";

export const LastChange = ({
    changes,
    style,
    as = "p",
}: {
    changes: PrivateMemberChangeSchemaType[] | StartupChangeSchemaType[];
    style?: CSSProperties;
    as?: React.ElementType;
}) => {
    const Component = as;
    return (
        (changes && changes.length && (
            <Component
                style={{ color: "var(--text-mention-grey)", ...(style || {}) }}
                className={fr.cx("fr-text--xs")}
            >
                Dernière modification le{" "}
                {format(changes[0].created_at, "d MMMM yyyy", {
                    locale: frLocale,
                })}{" "}
                par{" "}
                <Link href={`/community/${changes[0].created_by_username}`}>
                    {changes[0].created_by_username}
                </Link>
            </Component>
        )) ||
        null
    );
};

export default LastChange;
