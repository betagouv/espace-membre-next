import routes from "@/routes/routes";

export const PUBLIC_ROUTES = [
    "/login",
    routes.LOGIN_API,
    "/signin",
    routes.SIGNIN_API,
    routes.WHAT_IS_GOING_ON_WITH_MEMBER,
    routes.WHAT_IS_GOING_ON_WITH_MEMBER_SIMPLE,
    routes.WHAT_IS_GOING_ON_WITH_MEMBER_WITH_TYPO,
    routes.ONBOARDING,
    routes.ONBOARDING_API,
    routes.ONBOARDING_ACTION,
    /api\/public\/users\/*/,
    /hook\/*/,
    /onboardingSuccess\/*/,
];
