import { Formation, formationSchema } from "@/models/formation";
import { FieldSet, Record } from "airtable";

export const airtableRecordToFormation = (
    record: Record<FieldSet>
): Formation => {
    const image = record.get("Image");

    const item = {
        id: record.get("Record ID"),
        airtable_id: record.get("Record ID"),
        description: record.get("Description"),
        name: record.get("Formation"),
        imageUrl: image ? image[0].thumbnails.full.url : undefined,
        created_at: new Date(record.get("Created") as string), // Assurez-vous que c'est le bon champ pour "created_at"
        formation_date: new Date(record.get("Début") as string),
        formation_type: record.get("formationTypeName")
            ? (record.get("formationTypeName") as string[])[0]
            : undefined,
        formation_type_airtable_id: record.get("formationType")
            ? (record.get("formationType") as string[])[0]
            : undefined,
        is_embarquement: record.get("embarquement") === "true",
        audience: record.get("Audience"),
        category: record.get("Catégorie"),
        start: new Date(record.get("Début") as string),
        end: new Date(record.get("Fin") as string),
        animatorEmail: record.get("Email organisateur")
            ? record.get("Email organisateur")
            : undefined,
        googleAgendaEvent: record.get("Google Calendar Event ID"),
        startDate: new Date(record.get("Début") as string),
        startTime: record.get("Heure début"),
        inscriptionLink: record.get("preselectedInscriptionLink"),
        availableSeats: record.get("Place restantes en chiffre"),
        maxSeats: record.get("Max participants"),
        // Assurez-vous d'ajuster tous les autres champs de manière similaire
    };

    return formationSchema.parse(item);
};
