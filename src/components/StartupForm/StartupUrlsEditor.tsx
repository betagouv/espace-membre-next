import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { Table } from "@codegouvfr/react-dsfr/Table";
import {
  Control,
  FieldErrors,
  useFieldArray,
  UseFormRegister,
  UseFormTrigger,
} from "react-hook-form";

import {
  startupInfoUpdateSchemaInputType,
  startupInfoUpdateSchemaType,
} from "@/models/actions/startup";
import {
  STARTUP_URL_TYPES,
  STARTUP_URL_TYPE_LABELS,
} from "@/models/startupUrl";

import "./startup-urls-table.css";

export function StartupUrlsEditor({
  control,
  register,
  trigger,
  errors,
}: {
  control: Control<
    startupInfoUpdateSchemaInputType,
    any,
    startupInfoUpdateSchemaType
  >;
  register: UseFormRegister<startupInfoUpdateSchemaInputType>;
  trigger: UseFormTrigger<startupInfoUpdateSchemaInputType>;
  errors?: FieldErrors<startupInfoUpdateSchemaInputType>["startupUrls"];
}) {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "startupUrls",
  });

  return (
    <div className={fr.cx("fr-mb-3w")}>
      {fields.length > 0 && (
        <Table
          fixed
          className="table-startup-urls"
          headers={["Type", "Libellé (facultatif)", "URL", "Actions"]}
          data={fields.map((field, index) => [
            <Select
              key={`${field.id}-type`}
              label={
                <span className="fr-sr-only">{`Type du lien ${index + 1}`}</span>
              }
              nativeSelectProps={register(`startupUrls.${index}.type`, {
                // L'erreur de doublon porte sur l'autre ligne du meme type :
                // sans revalider toute la liste, elle ne s'afficherait pas.
                onChange: () => trigger("startupUrls"),
              })}
              state={errors?.[index]?.type ? "error" : "default"}
              stateRelatedMessage={errors?.[index]?.type?.message}
            >
              {STARTUP_URL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {STARTUP_URL_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>,
            <Input
              key={`${field.id}-label`}
              label={
                <span className="fr-sr-only">{`Libellé du lien ${index + 1}`}</span>
              }
              nativeInputProps={{
                placeholder: "ex : Version bêta",
                ...register(`startupUrls.${index}.label`),
              }}
              state={errors?.[index]?.label ? "error" : "default"}
              stateRelatedMessage={errors?.[index]?.label?.message}
            />,
            <Input
              key={`${field.id}-url`}
              label={
                <span className="fr-sr-only">{`URL du lien ${index + 1}`}</span>
              }
              nativeInputProps={{
                placeholder: "https://",
                ...register(`startupUrls.${index}.url`),
              }}
              state={errors?.[index]?.url ? "error" : "default"}
              stateRelatedMessage={errors?.[index]?.url?.message}
            />,
            <div key={`${field.id}-actions`} style={{ display: "flex" }}>
              <Button
                iconId="fr-icon-arrow-up-line"
                priority="tertiary no outline"
                size="small"
                title={`Monter le lien ${index + 1}`}
                disabled={index === 0}
                nativeButtonProps={{ type: "button" }}
                onClick={() => move(index, index - 1)}
              />
              <Button
                iconId="fr-icon-delete-bin-line"
                priority="tertiary no outline"
                size="small"
                title={`Supprimer le lien ${index + 1}`}
                nativeButtonProps={{ type: "button" }}
                onClick={() => remove(index)}
              />
            </div>,
          ])}
        />
      )}
      <Button
        iconId="fr-icon-add-circle-line"
        priority="secondary"
        size="small"
        nativeButtonProps={{ type: "button" }}
        onClick={() => append({ type: "website", label: null, url: "" })}
      >
        Ajouter un lien
      </Button>
    </div>
  );
}
