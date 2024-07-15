import {
    DocSchemaType,
    docSchema,
    docComiteDataSchema,
} from "@/models/startupFiles";
import { zodResolver } from "@hookform/resolvers/zod";
import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import { useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";

const contenus = [
    {
        label: "recherche-ux",
        description: "Une synthèse de recherche utilisateur",
    },
    { label: "benchmark", description: "Un benchmark de solutions existantes" },
    { label: "impact", description: "Une évaluation de notre impact à date" },
    {
        label: "roadmap",
        description: "Notre feuille de route produit pour les prochains mois",
    },
    { label: "budget", description: "Notre budget" },
];

function isComiteSchema(
    schema: z.AnyZodObject
): schema is typeof docComiteSchema {
    return (
        schema &&
        schema.shape &&
        schema.shape.data &&
        typeof schema.shape.data.shape === "object"
    );
}

const docComiteSchema = docSchema.merge(
    z.object({
        data: docComiteDataSchema,
    })
);
export const FormDoc = ({
    file,
    type,
    onSubmit,
}: {
    file: File;
    type: DocSchemaType["type"];
    onSubmit: (DocSchemaType) => any;
}) => {
    const schema = type === "Document de comité" ? docComiteSchema : docSchema;
    useEffect(() => {
        reset();
        trigger("title"); // necessary to revive form for some reason
    }, [file, type]);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isDirty, isValid },
        reset,
        watch,
        setValue,
        trigger,
    } = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            title: file.name.replace(/(\.[a-z]{3,4})/, ""),
            data: type === "Document de comité" && {
                contenu: [],
                date_comite: undefined,
            },
            comments: "",
        },
        reValidateMode: "onChange",
    });

    const onFormSubmit: SubmitHandler<z.infer<typeof schema>> = async (
        data
    ) => {
        if (!isValid) {
            alert("Invalid form");
            return;
        }
        await onSubmit(data);
        reset();
        return true;
    };

    const handleCheckboxChange = (newValue) => {
        if (selectedContenu && selectedContenu.includes(newValue)) {
            setValue(
                "data.contenu",
                selectedContenu.filter((item) => item !== newValue)
                //  { shouldDirty: true }
            );
        } else {
            setValue("data.contenu", [...selectedContenu, newValue], {
                //shouldDirty: true,
            });
        }
    };
    // const selectedData = watch("data", {});
    const selectedContenu = watch("data.contenu", []);

    return (
        <form
            onSubmit={handleSubmit(onFormSubmit)}
            aria-label="Modifier mes informations"
        >
            <input {...register("type", { value: type })} type="hidden" />

            <Input
                label={schema.shape.title.description}
                nativeInputProps={{
                    ...register("title"),
                    required: true,
                }}
                state={errors.title ? "error" : "default"}
                stateRelatedMessage={errors.title?.message}
            />
            {isComiteSchema(schema) && (
                <>
                    {schema.shape.data.shape.date_comite && (
                        <Input
                            label={
                                schema.shape.data.shape.date_comite.description
                            }
                            nativeInputProps={{
                                ...register("data.date_comite"),
                                type: "date",
                                required: true,
                            }}
                            state={
                                // @ts-ignore todo
                                errors.data?.date_comite ? "error" : "default"
                            }
                            stateRelatedMessage={
                                // @ts-ignore todo
                                errors.data?.date_comite?.message
                            }
                        />
                    )}

                    {schema.shape.data &&
                        typeof schema.shape.data === "object" && (
                            <Checkbox
                                small
                                legend={
                                    schema.shape.data.shape.contenu.description
                                }
                                state={
                                    // @ts-ignore todo
                                    errors.data?.contenu ? "error" : "default"
                                }
                                stateRelatedMessage={
                                    // @ts-ignore todo
                                    errors.data?.contenu?.message
                                }
                                options={contenus.map((m, i) => ({
                                    hintText: m.description,
                                    label: m.label,
                                    nativeInputProps: {
                                        value: m.label,
                                        checked: selectedContenu.includes(
                                            m.label
                                        ),
                                        onChange: () =>
                                            handleCheckboxChange(m.label),
                                    },
                                }))}
                            />
                        )}
                </>
            )}
            <Input
                label={schema.shape.comments.description}
                textArea={true}
                nativeTextAreaProps={{
                    ...register("comments"),
                }}
                state={errors.comments ? "error" : "default"}
                stateRelatedMessage={errors.comments?.message}
            />
            <Button
                type="submit"
                className={fr.cx("fr-mt-3w")}
                children={
                    isSubmitting ? `Enregistrement en cours...` : `Enregistrer`
                }
                nativeButtonProps={{
                    type: "submit",
                    disabled: !isValid || isSubmitting,
                }}
            />
        </form>
    );
};
