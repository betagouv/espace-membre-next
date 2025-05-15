type RequestOptions = {
    method: 'GET' | 'POST' | 'DELETE';
    body?: object;
};

export class OpiEmailService {
    private token
    constructor(private baseUrl: string, private baseUser: {
        username: string,
        password: string
    }) { }


    async listMailbox(domainName): Promise<{ email: string }[]> {
        const headers = await this.getHeaders();
        const params = new URLSearchParams();

        const endpoint = `${this.baseUrl}/domains/${domainName}/mailboxes/`

        const url = `${endpoint}?${params.toString()}`;

        const res = await fetch(url, {
            method: "GET",
            headers,
        });

        return await res.json();
    }

    async getToken() {
        if (this.token) return this.token;

        const params = new URLSearchParams();

        const auth = Buffer.from(`${this.baseUser.username}:${this.baseUser.password}`).toString("base64");
        const res = await fetch(`${this.baseUrl}/token/?${params.toString()}`, {
            method: "GET",
            headers: {
                Authorization: `Basic ${auth}`,
                Accept: "application/json",
            },
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch token: ${res.status}`);
        }

        const data = await res.json();
        this.token = data.access_token;
        return this.token;
    }

    async getHeaders() {
        const token = await this.getToken();
        return {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
        };
    }
}