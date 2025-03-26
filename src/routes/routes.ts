export const computeRoute = (route) => {
    return route;
};

class routes {
    // startup
    static ACCOUNT_POST_BASE_INFO_FORM =
        "/api/member/:username/info-update" as const;
    static API_PUBLIC_POST_BASE_INFO_FORM =
        "/api/public/account/base-info/:username" as const;
    static API_POST_BADGE_REQUEST = "/api/badge" as const;
    static API_POST_BADGE_RENEWAL_REQUEST = "/api/badge/renewal" as const;
    static ME: string = "/api/me" as const;
    static LOGIN_API: string = "/api/login" as const;

    static ACCOUNT_UPDATE_INFO_API = "/api/member/:username" as const;
    static ACCOUNT_POST_INFO_API = "/api/member" as const;
}

export default routes;
