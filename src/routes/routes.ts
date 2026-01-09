export const computeRoute = (route) => {
  return route;
};

class routes {
  static ACCOUNT_POST_BASE_INFO_FORM =
    "/api/member/:username/info-update" as const;
  static API_PUBLIC_POST_BASE_INFO_FORM =
    "/api/public/account/base-info/:username" as const;
  static ME: string = "/api/me" as const;
  static ACCOUNT_POST_INFO_API = "/api/member" as const;
  static STARTUP_GET_INFO_UPDATE_FORM = "/startups/:startup/info-form" as const;
}

export default routes;
