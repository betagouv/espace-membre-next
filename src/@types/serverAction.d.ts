interface SuccessResponse<T> {
    success: true;
    message?: string;
    data: T;
}

interface ErrorResponse {
    success: false;
    message: string;
    data?: undefined;
}

export type ActionResponse<T = any> = SuccessResponse<T> | ErrorResponse;
