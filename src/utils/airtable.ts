import { FieldSet, Record } from "airtable";

import {
    Formation,
    FormationInscription,
    formationInscriptionSchema,
    formationSchema,
} from "@/models/formation";

export const airtableRecordToFormation = (
    record: Record<FieldSet>,
): Formation => {
    const image = record.fields["Image"];

    const item = {
        id: record.fields["Record ID"],
        airtable_id: record.fields["Record ID"],
        description: record.fields["Description"],
        name: record.fields["Formation"],
        imageUrl: image ? image[0].url : undefined,
        created_at: new Date(record.fields["Created"] as string), // Make sure this is the correct field for "created_at"
        formation_date: record.fields["Début"]
            ? new Date(record.fields["Début"] as string)
            : undefined,
        formation_type: record.fields["formationTypeName"]
            ? (record.fields["formationTypeName"] as string[])[0]
            : undefined,
        formation_type_airtable_id: record.fields["formationType"]
            ? (record.fields["formationType"] as string[])[0]
            : undefined,
        is_embarquement: !!record.fields["embarquement"],
        isELearning: !!record.fields["isELearning"],
        audience: record.fields["Audience"],
        category: record.fields["Catégorie"],
        start: record.fields["Début"]
            ? new Date(record.fields["Début"] as string)
            : undefined,
        end: new Date(record.fields["Fin"] as string),
        animatorEmail: record.fields["Email organisateur"]
            ? record.fields["Email organisateur"]
            : undefined,
        animator: record.fields["Animateur"],
        googleAgendaEvent: record.fields["Google Calendar Event ID"],
        startDate: record.fields["Début"]
            ? new Date(record.fields["Début"] as string)
            : undefined,
        inscriptionLink:
            record.fields["preselectedInscriptionEspaceMembreLink"],
        availableSeats: record.fields["Place restantes en chiffre"],
        maxSeats: record.fields["Max participants"],
        registeredMembers: record.fields["registeredMemberUsernames"],
        waitingListUsernames: record.fields["waitingListUsernames"],
    };

    return formationSchema.parse(item);
};

export const airtableRecordToFormationInscription = (
    record: Record<FieldSet>,
): FormationInscription => {
    return formationInscriptionSchema.parse({
        username: record.fields["username"],
        name: record.fields["Nom"],
        email: record.fields["Email"],
        formation: record.fields["Formation"]
            ? record.fields["Formation"][0]
            : undefined,
        isInWaitingList: !!record.fields["isInWaitingList"],
    });
};
