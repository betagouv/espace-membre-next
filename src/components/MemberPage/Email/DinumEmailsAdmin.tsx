"use client";
import { useCallback, useEffect, useState } from "react";

import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import Table from "@codegouvfr/react-dsfr/Table";

import {
  safeAttachDinumEmailToMember,
  safeGetMemberDinumEmails,
  safeReleaseDinumEmail,
} from "@/app/api/member/actions/dinumEmails";

type DinumEmailRow = {
  email: string;
  type: string | null;
  status: string | null;
  destination: string | null;
  user_id_locked_by: string | null;
};

export const DinumEmailsAdmin = ({ username }: { username: string }) => {
  const [rows, setRows] = useState<DinumEmailRow[]>([]);
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    const res = await safeGetMemberDinumEmails(username);
    if (res.success) {
      setRows(res.data);
    } else {
      setError(res.message);
    }
  }, [username]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const run = async (
    action: () => Promise<{ success: boolean; message?: string }>,
  ) => {
    setIsSaving(true);
    setError(undefined);
    const res = await action();
    setIsSaving(false);
    if (!res.success) {
      setError(res.message);
    }
    await refresh();
  };

  return (
    <Accordion label="Adresses Dimail rattachées à cette fiche">
      <p className="fr-text--sm">
        Une adresse rattachée à la main n'est plus modifiée par la
        synchronisation.
      </p>
      {error && (
        <Alert
          className="fr-mb-2w"
          severity="warning"
          small
          closable={false}
          description={error}
        />
      )}
      {rows.length > 0 && (
        <Table
          headers={["Adresse", "Type", "Statut", "Rattachement", ""]}
          data={rows.map((row) => [
            row.email,
            row.type === "alias" && row.destination
              ? `alias vers ${row.destination}`
              : row.type || "",
            row.status || "",
            row.user_id_locked_by ? (
              <Badge small severity="info" noIcon>
                {`à la main (${row.user_id_locked_by})`}
              </Badge>
            ) : (
              "synchronisation"
            ),
            row.user_id_locked_by ? (
              <Button
                size="small"
                priority="secondary"
                nativeButtonProps={{ type: "button", disabled: isSaving }}
                onClick={() =>
                  run(() => safeReleaseDinumEmail(username, row.email))
                }
              >
                Rendre à la synchronisation
              </Button>
            ) : (
              ""
            ),
          ])}
        />
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            const res = await safeAttachDinumEmailToMember(username, email);
            const owner = res.success ? res.data.currentOwner : null;
            if (
              owner &&
              confirm(
                `${email} est rattachée à la fiche ${owner}, et permet de se connecter à son compte. La déplacer vers ${username} ?`,
              )
            ) {
              return safeAttachDinumEmailToMember(username, email, {
                confirmMove: true,
              });
            }
            return res;
          });
        }}
      >
        <Input
          label="Rattacher une adresse Dimail à cette fiche"
          hintText="L'adresse doit déjà exister dans Dimail."
          nativeInputProps={{
            type: "email",
            required: true,
            value: email,
            onChange: (e) => setEmail(e.target.value),
          }}
        />
        <Button nativeButtonProps={{ type: "submit", disabled: isSaving }}>
          Rattacher
        </Button>
      </form>
    </Accordion>
  );
};
