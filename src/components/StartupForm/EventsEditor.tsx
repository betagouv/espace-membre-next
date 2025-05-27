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
    UseFormSetValue,
} from "react-hook-form";
import { z } from "zod";

import {
    EVENT_READABLE_NAME,
    EVENTS_ORDERED_LIST,
    eventSchema,
} from "@/models/startup";

import "./events-table.css";

const eventsArraySchema = z.array(eventSchema);

export type HasEvents<T = any> = T & {
    events: z.infer<typeof eventsArraySchema>;
};

export function EventsEditor({
    control,
    errors,
    register,
    setValue,
    getValues,
}: {
    control: Control<HasEvents>;
    errors?: Record<string, any>;
    register: UseFormRegister<HasEvents>;
    setValue: UseFormSetValue<HasEvents>;
    getValues: any;
}) {
    const {
        fields: eventsFields,
        append: eventsAppend,
        remove: eventsRemove,
        update: eventsUpdate,
    } = useFieldArray({
        rules: { minLength: 1 },
        control,
        name: "startupEvents",
    });

    const addMissionClick = (e) => {
        eventsAppend({
            date: new Date(),
            name: "",
        });
    };

    useWatch({
        control,
        name: `startupEvents`,
    });
    return (
        <div className={fr.cx("fr-mb-3w")}>
            {(errors && errors.message && (
                <div className={fr.cx("fr-error-text", "fr-mb-3w")}>
                    {errors.message}
                </div>
            )) ||
                (Array.isArray(errors) &&
                    errors.length &&
                    errors.map((err) =>
                        Object.keys(err).map((key) => (
                            <div className={fr.cx("fr-error-text")} key={key}>
                                {key}: {err[key].message}
                            </div>
                        )),
                    )) ||
                null}
            <Table
                style={{ marginBottom: "0.5rem" }}
                className="table-events"
                fixed={true}
                data={eventsFields.map((event, index) => {
                    const eventDateString = getValues(
                        `startupEvents.${index}.date`,
                    )
                        ? new Date(getValues(`startupEvents.${index}.date`))
                              .toISOString()
                              .substring(0, 10)
                        : "";
                    return [
                        <Select
                            key={event.id + "-name"}
                            label={undefined}
                            nativeSelectProps={register(
                                `startupEvents.${index}.name`,
                            )}
                            state={
                                errors && errors[index]?.name?.message
                                    ? "error"
                                    : "default"
                            }
                            stateRelatedMessage={
                                errors && errors[index]?.name?.message
                            }
                        >
                            <option value="" disabled hidden>
                                Type d'événement
                            </option>
                            {Object.entries(EVENTS_ORDERED_LIST).map(
                                ([id, label], index) => (
                                    <option key={index} value={label}>
                                        {EVENT_READABLE_NAME[label]}
                                    </option>
                                ),
                            )}
                        </Select>,
                        <Input
                            label={null}
                            key={event.id + "-date"}
                            nativeInputProps={{
                                type: "date",
                                ...register(`startupEvents.${index}.date`),
                                value: eventDateString,
                            }}
                            state={
                                errors && errors[index]?.date?.message
                                    ? "error"
                                    : "default"
                            }
                            stateRelatedMessage={
                                errors && errors[index]?.date?.message
                            }
                        />,
                        <Input
                            label={null}
                            key={event.id + "-comment"}
                            textArea
                            nativeTextAreaProps={{
                                ...register(`startupEvents.${index}.comment`),
                            }}
                            state={
                                errors && errors[index]?.comment?.message
                                    ? "error"
                                    : "default"
                            }
                            stateRelatedMessage={
                                errors && errors[index]?.comment?.message
                            }
                        />,
                        (index > 0 && (
                            <button
                                className={fr.cx("fr-icon-delete-bin-line")}
                                style={{
                                    cursor: "pointer",
                                    float: "right",
                                }}
                                type="button"
                                onClick={() => eventsRemove(index)}
                                title={`Supprimer l'événement ${index + 1}`}
                            />
                        )) ||
                            null,
                    ];
                })}
                headers={["Événement", "Date", "Commentaires", "Action"]}
            />
            <Button
                iconId="fr-icon-add-circle-line"
                priority="secondary"
                size="small"
                type="button"
                onClick={addMissionClick}
            >
                Ajouter un événement
            </Button>
        </div>
    );
}
