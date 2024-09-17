import { fr } from "@codegouvfr/react-dsfr";
import { format } from "date-fns";
import { fr as frLocale } from "date-fns/locale/fr";
import Link from "next/link";

import { PrivateMemberChangeSchemaType } from "@/models/memberChange";

export const LastChange = ({
    changes,
}: {
    changes: PrivateMemberChangeSchemaType[];
}) =>
    (changes.length && (
        <p
            style={{ color: "var(--text-mention-grey)" }}
            className={fr.cx("fr-text--xs")}
        >
            Dernière modification le{" "}
            {format(changes[0].created_at, "d MMMM yyyy", { locale: frLocale })}{" "}
            par{" "}
            <Link href={`/community/${changes[0].created_by_username}`}>
                {changes[0].created_by_username}
            </Link>
        </p>
    )) ||
    null;

export default LastChange;
