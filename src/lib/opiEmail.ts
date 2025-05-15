// services/UserService.ts
type RequestOptions = {
    method: 'GET' | 'POST' | 'DELETE';
    body?: object;
};

export class OpiEmailService {
    constructor(private baseUrl: string, private baseUser: {
        username: string,
        password: string
    }) { }

    private async request<T>(path: string, options: RequestOptions): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
        const credentials = Buffer.from(`${this.baseUser.username}:${this.baseUser.password}`).toString("base64");
        headers['Authorization'] = `Basic ${credentials}`
        const res = await fetch(`${this.baseUrl}${path}`, {
            method: options.method,
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`Request failed: ${res.status} ${res.statusText} — ${errorBody}`);
        }

        return res.json();
    }

    async listMailbox(domain: string): Promise<{ email: string }[]> {
        return this.request(`/domains/${domain}/mailboxes/`, {
            method: 'GET',
        });
    }
}