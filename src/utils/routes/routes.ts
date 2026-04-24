export const routes = {
  account: () => `/account`,
  accountEditBaseInfo: () => `/account/base-info`,
  accountEditPrivateInfo: () => `/account/info`,
  signIn: () => `/signin`,
  community: () => `/community`,
  communityMember: ({ username }: { username: string }) =>
    `/community/${username}`,
  communityCreateMember: () => `/community/create`,
  dashboard: () => `/dashboard`,
  incubatorDetailsEdit: ({ incubatorId }: { incubatorId: string }) =>
    `/incubators/${incubatorId}`,
  incubatorList: () => `/incubators`,
  incubatorCreate: () => `/incubators/create-form`,
  incubatorDetails: ({ incubatorId }: { incubatorId: string }) =>
    `/incubators/${incubatorId}`,
  teamDetailsEdit: ({ teamId }: { teamId: string }) => `/teams/${teamId}`,
  teamList: () => `/teams`,
  teamCreate: () => `/teams/create-form`,
  teamDetails: ({ teamId }: { teamId: string }) => `/teams/${teamId}`,
  startupList: () => `/startups`,
  startupDetails: ({ startupId }: { startupId: string }) =>
    `/startups/${startupId}`,
  startupDetailsEdit: ({ startupId }: { startupId: string }) =>
    `/startups/${startupId}/info-form`,
  startupDocs: ({ startupId }: { startupId: string }) =>
    `/startups/${startupId}/files`,
  startupCreate: () => `/startups/create-form`,
  home: () => `/`,
  login: () => `/login`,
  onboarding: () => `/onboarding`,
  onboardingSuccess: () => `/onboardingSuccess`,
  metabase: () => `/metabase`,
  keskispasse: () => `/keskispasse`,
  eventsList: () => `/events`,
  formationList: () => `/formations`,
  formationDetails: () => `/formations/.*`,
  verifyMember: () => `/verify`,
  organizationList: () => `/organizations`,
  organizationDetails: ({ organizationId }: { organizationId: string }) =>
    `/organizations/${organizationId}`,
  organizationDetailsEdit: ({ organizationId }: { organizationId: string }) =>
    `/organizations/${organizationId}/info-form`,
  organizationCreate: () => `/organizations/create-form`,
  serviceList: () => `/services`,
} as const;
