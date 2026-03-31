import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import Table from "@codegouvfr/react-dsfr/Table";
import {
  Control,
  useFieldArray,
  useWatch,
  UseFormRegister,
} from "react-hook-form";

import { STARTUP_URL_TYPES, STARTUP_URL_TYPE_LABELS } from "@/models/startup";
import { startupInfoUpdateSchemaType } from "@/models/actions/startup";

import "./StartupUrlsEditor.css";

export type HasStartupUrls<T = any> = T & {
  startup_urls: startupInfoUpdateSchemaType["startup_urls"];
};

export function StartupUrlsEditor({
  control,
  errors,
  register,
}: {
  control: Control<HasStartupUrls>;
  errors?: Record<string, any>[];
  register: UseFormRegister<HasStartupUrls>;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "startup_urls",
  });

  useWatch({ control, name: "startup_urls" });

  return (
    <div className={fr.cx("fr-mb-3w")}>
      <Table
        fixed
        className="table-xs-col-last"
        style={{ marginBottom: "0.5rem" }}
        headers={["Type", "Label (optionnel)", "URL", "Action"]}
        data={fields.map((field, index) => [
          <Select
            key={field.id + "-type"}
            label={undefined}
            nativeSelectProps={register(`startup_urls.${index}.type`)}
          >
            {STARTUP_URL_TYPES.map((type) => (
              <option key={type} value={type}>
                {STARTUP_URL_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>,
          <Input
            label={null}
            key={field.id + "-label"}
            nativeInputProps={{
              placeholder: "Ex: Version bêta",
              ...register(`startup_urls.${index}.label`),
            }}
            state={errors?.[index]?.label ? "error" : "default"}
            stateRelatedMessage={errors?.[index]?.label?.message}
          />,
          <Input
            label={null}
            key={field.id + "-url"}
            nativeInputProps={{
              placeholder: "https://...",
              type: "url",
              ...register(`startup_urls.${index}.url`),
            }}
            state={errors?.[index]?.url ? "error" : "default"}
            stateRelatedMessage={errors?.[index]?.url?.message}
          />,
          <button
            key={field.id + "-remove"}
            className={fr.cx("fr-icon-delete-bin-line")}
            style={{ cursor: "pointer", float: "right" }}
            type="button"
            onClick={() => remove(index)}
            title={`Supprimer ce lien`}
          />,
        ])}
      />
      <Button
        iconId="fr-icon-add-circle-line"
        priority="secondary"
        size="small"
        type="button"
        onClick={() => append({ type: "website", label: null, url: "" })}
      >
        Ajouter un lien
      </Button>
    </div>
  );
}
