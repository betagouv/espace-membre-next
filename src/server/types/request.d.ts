declare namespace Express {
    export interface Request {
        auth?: {
            id: string;
        };
    }
}
