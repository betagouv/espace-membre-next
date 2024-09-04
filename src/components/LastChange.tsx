import { getEventListByUsername } from "@/lib/events";
import { format } from "date-fns";
import Link from "next/link";
import { fr } from "@codegouvfr/react-dsfr";

export const LastChange = ({
    changes,
}: {
    changes: Awaited<ReturnType<typeof getEventListByUsername>>;
}) =>
    (changes.length && (
        <p
            style={{ color: "var(--text-mention-grey)" }}
            className={fr.cx("fr-text--xs")}
        >
            Dernière modification le{" "}
            {format(changes[0].created_at, "dd/MM/yyyy")} par{" "}
            <Link href={`/community/${changes[0].created_by_username}`}>
                {changes[0].created_by_username}
            </Link>
        </p>
    )) ||
    null;

export default LastChange;
