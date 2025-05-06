import Crisp from 'crisp-api'
import { config } from "dotenv";
config()

class CripsTicketService {
    private CrispClient

    constructor() {
        this.CrispClient = new Crisp();

        // Authenticate to API with your plugin token (identifier, key)
        if (!process.env.CRISP_IDENTIFIER || !process.env.CRISP_KEY) {
            throw new Error('CRISP_IDENTIFIER and CRISP_KEY are required')
        }
        this.CrispClient.authenticateTier("plugin", process.env.CRISP_IDENTIFIER, process.env.CRISP_KEY);
    }

    async createEmailTicket({ email, username, creator }: { email: string, username: string, creator: string }) {
        const websiteId = process.env.CRISP_WEBSITE_ID
        try {
            const resp = await this.CrispClient.website.createNewConversation(websiteId)
            await this.CrispClient.website.updateConversationMetas(websiteId, resp.session_id, {
                email,
                subject: `Création d'email opi`,
                nickname: username
            })
            await this.CrispClient.website.sendMessageInConversation(
                websiteId, resp.session_id,
                {
                    type: "text",
                    content: `This is a message to create ${email} for ${username} from ${creator}`,
                    from: "user",
                    origin: "urn:*",
                    user: {
                        nickname: username
                    }
                })
            console.log('Session created')
        } catch (e) {
            console.log('error', e)
        }
    }
}

export default CripsTicketService