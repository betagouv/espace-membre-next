"use client";

import { useState } from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { format } from "date-fns";
import { fr as frLocale } from "date-fns/locale";

import {
  safeMergeMembers,
  safePreviewMemberMerge,
} from "@/app/api/admin/actions/mergeMembers";
import MemberSelect from "@/components/MemberSelect";
import {
  MEMBER_MERGE_LABELS,
  MemberMergeCounts,
  MemberMergeResult,
  MemberMergeSide,
} from "@/models/memberMerge";
import { routes } from "@/lib/routes";

type MemberOption = { uuid: string; username: string; fullname: string };

const formatDate = (date: Date | null) =>
  date ? format(new Date(date), "d MMMM yyyy", { locale: frLocale }) : "aucune";

function SideCard({ title, side }: { title: string; side: MemberMergeSide }) {
  return (
    <div className={fr.cx("fr-col-12", "fr-col-md-6")}>
      <div
        className={fr.cx("fr-p-3w")}
        style={{ border: "1px solid var(--border-default-grey)" }}
      >
        <h3 className={fr.cx("fr-h6", "fr-mb-1w")}>{title}</h3>
        <p className={fr.cx("fr-mb-1w")}>
          <a
            href={routes.communityMember({ username: side.username })}
            target="_blank"
            rel="noreferrer"
          >
            {side.fullname} ({side.username})
          </a>
        </p>
        <ul className={fr.cx("fr-mb-0")}>
          <li>Email principal : {side.primary_email || "aucun"}</li>
          <li>Email secondaire : {side.secondary_email || "aucun"}</li>
          <li>
            Fin de la dernière mission : {formatDate(side.last_mission_end)}
          </li>
        </ul>
      </div>
    </div>
  );
}

export function MemberMergeForm({ members }: { members: MemberOption[] }) {
  // Deux homonymes ne se distinguent que par leur username : on l'affiche.
  const options = members.map((m) => ({
    uuid: m.uuid,
    username: m.username,
    fullname: `${m.fullname} — ${m.username}`,
  }));
  const [keepUuid, setKeepUuid] = useState<string>();
  const [absorbedUuid, setAbsorbedUuid] = useState<string>();
  const [preview, setPreview] = useState<MemberMergeResult>();
  const [done, setDone] = useState<MemberMergeResult>();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  // Les sélecteurs ne sont pas contrôlés : on les remonte après une inversion
  // pour qu'ils affichent la nouvelle répartition.
  const [swapCount, setSwapCount] = useState(0);
  const optionFor = (uuid?: string) => {
    const option = options.find((o) => o.uuid === uuid);
    return option ? { value: option.uuid, label: option.fullname } : undefined;
  };

  const resetPreview = () => {
    setPreview(undefined);
    setConfirmed(false);
    setError(undefined);
  };

  const loadPreview = async (keep: string, absorbed: string) => {
    setPending(true);
    resetPreview();
    const res = await safePreviewMemberMerge({
      keepUuid: keep,
      absorbedUuid: absorbed,
    });
    setPending(false);
    if (res.success) setPreview(res.data);
    else setError(res.message);
  };

  const swap = () => {
    if (!keepUuid || !absorbedUuid) return;
    setKeepUuid(absorbedUuid);
    setAbsorbedUuid(keepUuid);
    setSwapCount((n) => n + 1);
    loadPreview(absorbedUuid, keepUuid);
  };

  const merge = async () => {
    if (!preview) return;
    setPending(true);
    setError(undefined);
    const res = await safeMergeMembers({
      keepUuid: preview.keep.uuid,
      absorbedUuid: preview.absorbed.uuid,
    });
    setPending(false);
    if (res.success) {
      setDone(res.data);
      setPreview(undefined);
    } else setError(res.message);
  };

  if (done) {
    return (
      <Alert
        severity="success"
        title={`La fiche ${done.absorbed.username} a été fusionnée dans ${done.keep.username}`}
        description={
          <>
            <p>
              <a
                href={routes.communityMember({ username: done.keep.username })}
              >
                Ouvrir la fiche de {done.keep.fullname}
              </a>
            </p>
            <p>À faire à la main si besoin :</p>
            <ul>
              <li>
                la boîte mail{" "}
                {done.absorbed.primary_email || "de l'ancienne fiche"}, qui
                n&apos;a pas été touchée ;
              </li>
              <li>
                la fiche auteur {done.absorbed.username} sur beta.gouv.fr, que
                l&apos;export ne supprime pas.
              </li>
            </ul>
          </>
        }
      />
    );
  }

  const changed = (
    Object.keys(MEMBER_MERGE_LABELS) as (keyof MemberMergeCounts)[]
  ).filter((key) => preview && preview.counts[key] > 0);

  return (
    <div>
      <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
        <div className={fr.cx("fr-col-12", "fr-col-md-6")}>
          <MemberSelect
            key={`keep-${swapCount}`}
            id="merge-keep"
            label="Fiche à garder"
            hint="En général celle qui a la mission en cours."
            members={options}
            valueKey="uuid"
            defaultValue={optionFor(keepUuid)}
            onChange={(value: any) => {
              setKeepUuid(value?.value);
              resetPreview();
            }}
          />
        </div>
        <div className={fr.cx("fr-col-12", "fr-col-md-6")}>
          <MemberSelect
            key={`absorbed-${swapCount}`}
            id="merge-absorbed"
            label="Fiche à absorber"
            hint="Elle sera supprimée après la fusion."
            members={options}
            valueKey="uuid"
            defaultValue={optionFor(absorbedUuid)}
            onChange={(value: any) => {
              setAbsorbedUuid(value?.value);
              resetPreview();
            }}
          />
        </div>
      </div>

      {!preview && (
        <Button
          className={fr.cx("fr-mt-2w")}
          disabled={!keepUuid || !absorbedUuid || pending}
          onClick={() =>
            keepUuid && absorbedUuid && loadPreview(keepUuid, absorbedUuid)
          }
        >
          Voir ce qui va être fusionné
        </Button>
      )}

      {error && (
        <Alert
          className={fr.cx("fr-mt-3w")}
          severity="error"
          small
          description={error}
        />
      )}

      {preview && (
        <div className={fr.cx("fr-mt-4w")}>
          <h2 className={fr.cx("fr-h4")}>Aperçu</h2>
          <div
            className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-mb-2w")}
          >
            <SideCard title="Fiche gardée" side={preview.keep} />
            <SideCard
              title="Fiche absorbée, puis supprimée"
              side={preview.absorbed}
            />
          </div>
          <Button
            priority="secondary"
            size="small"
            onClick={swap}
            disabled={pending}
          >
            Inverser les deux fiches
          </Button>

          <h3 className={fr.cx("fr-h6", "fr-mt-4w")}>
            Ce qui passe sur la fiche {preview.keep.username}
          </h3>
          {changed.length ? (
            <Table
              headers={["Élément", "Nombre"]}
              data={changed.map((key) => [
                MEMBER_MERGE_LABELS[key],
                String(preview.counts[key]),
              ])}
            />
          ) : (
            <p>
              Rien à déplacer : la fiche absorbée sera simplement supprimée.
            </p>
          )}

          <Alert
            severity="warning"
            small
            className={fr.cx("fr-mb-3w")}
            description={
              <>
                La fiche gardée garde son nom, ses emails et sa bio. Hors fusion
                : la boîte mail{" "}
                {preview.absorbed.primary_email || "de la fiche absorbée"} et sa
                fiche auteur sur beta.gouv.fr. La suppression est définitive.
              </>
            }
          />

          <Checkbox
            options={[
              {
                label: `Je confirme que ${preview.keep.username} et ${preview.absorbed.username} sont la même personne`,
                nativeInputProps: {
                  checked: confirmed,
                  onChange: (e) => setConfirmed(e.target.checked),
                },
              },
            ]}
          />
          <Button
            className={fr.cx("fr-mt-2w")}
            onClick={merge}
            disabled={!confirmed || pending}
          >
            Fusionner et supprimer {preview.absorbed.username}
          </Button>
        </div>
      )}
    </div>
  );
}
