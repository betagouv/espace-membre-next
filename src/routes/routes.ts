export const computeRoute = (route) => {
  return route;
};

class routes {
  static ME: string = "/api/me" as const;
  static STARTUP_GET_INFO_UPDATE_FORM = "/startups/:startup/info-form" as const;
}

export default routes;
