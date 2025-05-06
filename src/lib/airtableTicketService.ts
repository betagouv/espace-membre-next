import { config } from "dotenv";
config()

class AirtableTicketService {

    constructor() {
        if (!process.env.AIRTABLE_OPS_API_KEY || !process.env.AIRTABLE_OPS_BASE_ID || !process.env.AIRTABLE_DEMANDE_BASE_ID) {
            throw new Error('AIRTABLE_API_KEY, AIRTABLE_OPS_BASE_ID, AIRTABLE_DEMANDE_BASE_ID are required')
        }
    }

    async createEmailTicket({ email, username, creator }: { email: string, username: string, creator: string }) {
        const baseUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_OPS_BASE_ID}/${process.env.AIRTABLE_DEMANDE_BASE_ID}`;
        const token = process.env.AIRTABLE_OPS_API_KEY; // Replace YOUR_TOKEN with your actual Airtable API token


        const response = await fetch(baseUrl, {
            method: "POST", // or 'POST' if you are creating/updating records
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                // Additional headers can be added here if needed
            },
            body: JSON.stringify({
                "fields": {
                    "Name": `@${username}`,
                    "demande": `Autre`,
                    "Statut": 'Fini',
                    // "startup": 'test',
                    // "email": 'lucharrier@gmail.com',
                    // "Renseigne ta demande dans ce champs libre :": 'test',
                }
            })
        });

        if (!response.ok) {
            console.log(response)
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return
    }
}

export default AirtableTicketService