export const computeRoute = (route) => {
    return route;
};

class routes {
    // startup
    static STARTUP_GET_ALL = "/startups" as const;
    static STARTUP_GET_ALL_API = "/api/startups" as const;
    static STARTUP_GET_DETAIL = "/startups/:startup" as const;
    static STARTUP_GET_DETAIL_API = "/api/startups/:startup" as const;
    static STARTUP_GET_INFO_UPDATE_FORM =
        "/startups/:startup/info-form" as const;
    static STARTUP_GET_INFO_UPDATE_FORM_API =
        "/api/startups/:startup/info-form" as const;
    static STARTUP_POST_INFO_UPDATE_FORM =
        "/api/startups/:startup/info-form" as const;
    static STARTUP_GET_INFO_CREATE_FORM = "/api/startups/create-form" as const;
    static STARTUP_GET_INFO_CREATE_FORM_API =
        "/api/startups/create-form" as const;
    static STARTUP_POST_INFO_CREATE_FORM = "/api/startups" as const;

    // page de diagnostic
    static WHAT_IS_GOING_ON_WITH_MEMBER_WITH_TYPO =
        "/que-ce-passe-t-il" as const;
    static WHAT_IS_GOING_ON_WITH_MEMBER = "/que-se-passe-t-il" as const;
    static WHAT_IS_GOING_ON_WITH_MEMBER_SIMPLE = "/keskispasse" as const;
    // ADMIN
    static ADMIN_MATTERMOST_API = "/api/admin/mattermost" as const;
    static ADMIN_MATTERMOST_MESSAGE_API =
        "/api/admin/mattermost/message/users" as const;
    static ADMIN_MATTERMOST_SEND_MESSAGE =
        "/api/admin/mattermost/send-message" as const;
    // onboarding
    static ONBOARDING = "/onboarding" as const;
    static ONBOARDING_API = "/api/onboarding" as const;
    static ONBOARDING_ACTION = "/onboarding" as const;
    static ONBOARDING_ACTION_API = "/api/onboarding" as const;
    // users
    static USER_CREATE_EMAIL = "/users/:username/email" as const;
    static USER_DELETE_EMAIL_API = "/api/users/:username/email/delete" as const;
    static USER_CREATE_REDIRECTION_API =
        "/api/users/:username/redirections" as const;
    static USER_DELETE_REDIRECTION_API =
        "/api/users/:username/redirections/:email/delete" as const;
    static USER_UPDATE_PASSWORD_API = "/api/users/:username/password" as const;
    static USER_UPDATE_SECONDARY_EMAIL_API =
        "/api/users/:username/secondary_email" as const;
    static USER_UPDATE_PRIMARY_EMAIL_API =
        "/api/users/:username/primary_email" as const;
    static USER_UPGRADE_EMAIL_API =
        "/api/users/:username/email-upgrade" as const;
    static USER_CREATE_EMAIL_API = "/api/users/:username/create-email" as const;
    static API_GET_PUBLIC_USER_INFO = "/api/public/users/:username" as const;
    static USER_SET_EMAIL_RESPONDER_API =
        "/api/account/set_email_responder" as const;
    // static USER_DELETE_EMAIL_RESPONDER_API =
    //     "/api/account/delete_email_responder" as const;
    // static USER_UPDATE_COMMUNICATION_EMAIL_API =
    //     "/api/account/update_communication_email" as const;
    // account
    static ACCOUNT_GET = "/account" as const;
    static ACCOUNT_GET_API = "/api/account" as const;
    static ACCOUNT_GET_BASE_INFO_FORM = "/account/base-info" as const;
    static ACCOUNT_GET_BASE_INFO_FORM_API = "/api/account/base-info" as const;

    static ACCOUNT_POST_BASE_INFO_FORM =
        "/api/member/:username/info-update" as const;
    static ACCOUNT_GET_DETAIL_INFO_FORM_API = "/api/account/info" as const;
    static ACCOUNT_POST_DETAIL_INFO_FORM = "/api/account/info" as const;
    static API_PUBLIC_POST_BASE_INFO_FORM =
        "/api/public/account/base-info/:username" as const;
    static ACCOUNT_GET_BADGE_REQUEST_PAGE = "/account/badge-demande" as const;
    static ACCOUNT_GET_BADGE_REQUEST_PAGE_API =
        "/api/account/badge-demande" as const;
    // static ACCOUNT_GET_BADGE_RENEWAL_REQUEST_PAGE_API =
    //     "/api/account/badge-demande/renewal" as const;
    static API_POST_BADGE_REQUEST = "/api/badge" as const;
    static API_POST_BADGE_RENEWAL_REQUEST = "/api/badge/renewal" as const;
    static API_UPDATE_BADGE_REQUEST_STATUS = "/api/badge/status" as const;
    static PULL_REQUEST_GET_PRS: string = "/api/pull-requests" as const;
    static ME: string = "/api/me" as const;
    static LOGIN_API: string = "/api/login" as const;
    static SIGNIN: string = "/signin" as const;
    static SIGNIN_API: string = "/api/signin" as const;
    static API_UPDATE_BADGE_STATUS: string;

    static GET_USER: string = "/community/:username" as const;
    static GET_COMMUNITY: string = "/community" as const;

    static LOGOUT: string = "/logout" as const;
    static LOGOUT_API: string = "/api/logout" as const;
    static ACCOUNT_POST_DETAIL_INFO_FORM_API = "/api/account/info" as const;
    static API_UPDATE_BADGE_RENEWAL_REQUEST_STATUS =
        "/api/badge/renewal/status" as const;
    static ADMIN_SENDINBLUE = "/api/admin/sendinblue" as const;
    static ACCOUNT_UPDATE_INFO_API = "/api/member/:username" as const;
    static ACCOUNT_POST_INFO_API = "/api/member" as const;
}

export default routes;
