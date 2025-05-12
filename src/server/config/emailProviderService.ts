import { OpiEmailService } from "@/lib/opiEmail";

interface EmailProviderService {
    listMailbox: (domain: string) => Promise<{
        email: string
    }[]>
}

export function createEmailProviderService(): EmailProviderService {
    return new OpiEmailService('https://numerique.gouv.fr')
}