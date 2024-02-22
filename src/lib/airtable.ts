import { Formation } from "@/models/formation";
import config from "@/server/config";
import Airtable from "airtable";
import { airtableRecordToFormation } from "@/utils/airtable";

export async function fetchAirtableFormationById(
    recordId: string
): Promise<Formation> {
    var base = new Airtable({ apiKey: config.AIRTABLE_API_KEY }).base(
        config.AIRTABLE_FORMATION_BASE_ID!
    );
    const record = await base("Formations").find(recordId);
    return airtableRecordToFormation(record);
}
