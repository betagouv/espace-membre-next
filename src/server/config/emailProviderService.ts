import { OpiEmailService } from "@/lib/opiEmail";

interface EmailProviderService {
    listMailbox: (domain: string) => Promise<{
        email: string
    }[]>
}

export function createEmailProviderService(): EmailProviderService {
    return new OpiEmailService(process.env.OPI_URL!, {
        username: process.env.OPI_USERNAME!,
        password: process.env.OPI_KEY!
    })
}