import { Formation, FormationInscription } from "@/models/formation";
import config from "@/server/config";
import {
    airtableRecordToFormation,
    airtableRecordToFormationInscription,
} from "@/utils/airtable";

export async function fetchAirtableFormations(): Promise<Formation[]> {
    const baseUrl = `https://api.airtable.com/v0/${config.AIRTABLE_FORMATION_BASE_ID}/Formations`;
    const token = config.AIRTABLE_API_KEY; // Replace YOUR_TOKEN with your actual Airtable API token
    const queryParams = {
        view: "Formations à venir",
    };

    // Construct query string
    const queryString = new URLSearchParams(queryParams).toString();

    // Append query string to base URL
    const url = `${baseUrl}?${queryString}`;

    const response = await fetch(url, {
        method: "GET", // or 'POST' if you are creating/updating records
        headers: {
            Authorization: `Bearer ${token}`,
            // Additional headers can be added here if needed
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.records.map((data) => airtableRecordToFormation(data));
}

export async function fetchAirtableInscription(
    username: string
): Promise<FormationInscription[]> {
    const baseUrl = `https://api.airtable.com/v0/${config.AIRTABLE_FORMATION_BASE_ID}/Inscriptions`;
    const token = config.AIRTABLE_API_KEY; // Replace YOUR_TOKEN with your actual Airtable API token
    const queryParams = {
        view: "Inscrits formations à venir",
        filterByFormula: `{username}="${username}"`,
    };

    // Construct query string
    const queryString = new URLSearchParams(queryParams).toString();

    // Append query string to base URL
    const url = `${baseUrl}?${queryString}`;

    const response = await fetch(url, {
        method: "GET", // or 'POST' if you are creating/updating records
        headers: {
            Authorization: `Bearer ${token}`,
            // Additional headers can be added here if needed
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.records.map((data) =>
        airtableRecordToFormationInscription(data)
    );
}

export async function fetchAirtableFormationById(
    recordId: string
): Promise<Formation> {
    const url = `https://api.airtable.com/v0/${config.AIRTABLE_FORMATION_BASE_ID}/Formations/${recordId}`;
    const token = config.AIRTABLE_API_KEY; // Replace YOUR_TOKEN with your actual Airtable API token

    const response = await fetch(url, {
        method: "GET", // or 'POST' if you are creating/updating records
        headers: {
            Authorization: `Bearer ${token}`,
            // Additional headers can be added here if needed
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return airtableRecordToFormation(data);
}
