import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Int8 = ColumnType<string, bigint | number | string, bigint | number | string>;

export type Json = JsonValue;

export type JsonArray = JsonValue[];

export type JsonObject = {
  [K in string]?: JsonValue;
};

export type JsonPrimitive = boolean | number | string | null;

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export type MissionsStatusEnum = "admin" | "independant" | "service";

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface Accounts {
  access_token: string | null;
  expires_at: Int8 | null;
  id: Generated<number>;
  id_token: string | null;
  provider: string;
  providerAccountId: string;
  refresh_token: string | null;
  scope: string | null;
  session_state: string | null;
  token_type: string | null;
  type: string;
  userId: string;
}

export interface BadgeRequests {
  created_at: Generated<Timestamp>;
  dossier_number: number | null;
  ds_token: string | null;
  end_date: Timestamp;
  id: Generated<number>;
  request_id: string;
  start_date: Timestamp;
  status: string | null;
  updated_at: Generated<Timestamp>;
  username: string;
}

export interface Community {
  admin: number | null;
  animation: number | null;
  autre: number | null;
  coaching: number | null;
  date: Timestamp | null;
  deploiement: number | null;
  design: number | null;
  developpement: number | null;
  female: number | null;
  independent: number | null;
  intraprenariat: number | null;
  male: number | null;
  nsp: number | null;
  other: number | null;
  produit: number | null;
  service: number | null;
}

export interface Events {
  action_code: string;
  action_metadata: string | null;
  action_on_username: string | null;
  created_at: Generated<Timestamp>;
  created_by_username: string;
  id: Generated<string>;
}

export interface Formations {
  airtable_id: string | null;
  created_at: Generated<Timestamp>;
  formation_date: Generated<Timestamp>;
  formation_type: string | null;
  formation_type_airtable_id: string | null;
  id: Generated<string>;
  is_embarquement: boolean | null;
  name: string;
}

export interface Incubators {
  address: string | null;
  contact: string | null;
  ghid: string | null;
  github: string | null;
  owner: string | null;
  owner_id: string | null;
  title: string;
  uuid: Generated<string>;
  website: string | null;
}

export interface KnexMigrations {
  batch: number | null;
  id: Generated<number>;
  migration_time: Timestamp | null;
  name: string | null;
}

export interface KnexMigrationsLock {
  index: Generated<number>;
  is_locked: number | null;
}

export interface LoginTokens {
  created_at: Generated<Timestamp>;
  email: string;
  expires_at: Timestamp;
  token: string;
  username: string;
}

export interface Marrainage {
  completed: Generated<boolean>;
  count: Generated<number>;
  created_at: Generated<Timestamp>;
  last_onboarder: string;
  last_updated: Generated<Timestamp>;
  username: string;
}

export interface MarrainageGroups {
  count: Generated<number>;
  created_at: Generated<Timestamp | null>;
  id: Generated<number>;
  onboarder: string | null;
  status: Generated<string | null>;
}

export interface MarrainageGroupsMembers {
  marrainage_group_id: Int8;
  username: string;
}

export interface MattermostMemberInfos {
  last_activity_at: Timestamp | null;
  mattermost_user_id: string | null;
  username: Generated<string | null>;
}

export interface Missions {
  employer: string | null;
  end: Timestamp | null;
  id: Generated<number>;
  role: string | null;
  start: Timestamp;
  startup: string | null;
  status: MissionsStatusEnum | null;
  user_id: string | null;
  username: string | null;
  uuid: Generated<string>;
}

export interface MissionsStartups {
  mission_id: string;
  startup_id: string;
  uuid: Generated<string>;
}

export interface Newsletters {
  created_at: Generated<Timestamp>;
  id: Generated<string>;
  sent_at: Timestamp | null;
  url: string;
  validator: string | null;
  year_week: string | null;
}

export interface Organizations {
  acronym: string | null;
  domaine_ministeriel: string;
  ghid: string | null;
  name: string;
  type: string;
  uuid: Generated<string>;
}

export interface PullRequests {
  created_at: Generated<Timestamp>;
  info: Json | null;
  startup: string | null;
  status: Generated<string | null>;
  type: Generated<string | null>;
  updated_at: Generated<Timestamp>;
  url: Generated<string | null>;
  username: string | null;
}

export interface Sessions {
  expires: Timestamp;
  id: Generated<number>;
  sessionToken: string;
  userId: string;
}

export interface Startups {
  accessibility_status: string | null;
  analyse_risques: boolean | null;
  analyse_risques_url: string | null;
  contact: string | null;
  content_url_encoded_markdown: string | null;
  current_phase: string | null;
  current_phase_date: Timestamp | null;
  dashlord_url: string | null;
  github: string | null;
  has_coach: boolean | null;
  has_intra: boolean | null;
  id: string | null;
  incubator: string | null;
  incubator_id: string | null;
  last_github_update: Timestamp | null;
  link: string | null;
  mailing_list: string | null;
  name: string | null;
  nb_active_members: number | null;
  nb_total_members: number | null;
  phases: Json | null;
  pitch: string | null;
  repository: string | null;
  stats: boolean | null;
  stats_url: string | null;
  uuid: Generated<string>;
  website: string | null;
}

export interface StartupsOrganizations {
  organization_id: string;
  startup_id: string;
  uuid: Generated<string>;
}

export interface Tasks {
  created_at: Generated<Timestamp>;
  description: string | null;
  error_message: string | null;
  last_completed: Timestamp | null;
  last_failed: Timestamp | null;
  name: string;
  updated_at: Generated<Timestamp>;
}

export interface UserDetails {
  active: boolean | null;
  average_nb_of_days: number | null;
  domaine: string | null;
  gender: Generated<string | null>;
  hash: string;
  nb_days_at_beta: number | null;
  tjm: number | null;
}

export interface Users {
  avatar: string | null;
  average_nb_of_days: number | null;
  bio: string | null;
  communication_email: Generated<string | null>;
  created_at: Generated<Timestamp>;
  domaine: string | null;
  email_is_redirection: Generated<boolean | null>;
  email_verified: Timestamp | null;
  fullname: string;
  gender: Generated<string | null>;
  github: string | null;
  legal_status: string | null;
  link: string | null;
  member_type: string | null;
  memberType: string | null;
  missions: Json | null;
  nb_days_at_beta: number | null;
  osm_city: string | null;
  primary_email: string | null;
  primary_email_status: Generated<string | null>;
  primary_email_status_updated_at: Generated<Timestamp | null>;
  role: string;
  secondary_email: string | null;
  should_create_marrainage: Generated<boolean | null>;
  startups: string[] | null;
  tjm: number | null;
  username: string;
  uuid: Generated<string>;
  workplace_insee_code: string | null;
}

export interface UsersFormations {
  formation_id: string | null;
  username: string | null;
}

export interface UsersStartups {
  startup_id: string;
  user_id: string;
}

export interface VerificationTokens {
  expires: Timestamp;
  identifier: string;
  token: string;
}

export interface Visits {
  created_at: Generated<Timestamp>;
  date: Timestamp;
  fullname: string;
  id: Generated<number>;
  number: string;
  referent: string;
  requester: string;
}

export interface DB {
  accounts: Accounts;
  badge_requests: BadgeRequests;
  community: Community;
  events: Events;
  formations: Formations;
  incubators: Incubators;
  knex_migrations: KnexMigrations;
  knex_migrations_lock: KnexMigrationsLock;
  login_tokens: LoginTokens;
  marrainage: Marrainage;
  marrainage_groups: MarrainageGroups;
  marrainage_groups_members: MarrainageGroupsMembers;
  mattermost_member_infos: MattermostMemberInfos;
  missions: Missions;
  missions_startups: MissionsStartups;
  newsletters: Newsletters;
  organizations: Organizations;
  pull_requests: PullRequests;
  sessions: Sessions;
  startups: Startups;
  startups_organizations: StartupsOrganizations;
  tasks: Tasks;
  user_details: UserDetails;
  users: Users;
  users_formations: UsersFormations;
  users_startups: UsersStartups;
  verification_tokens: VerificationTokens;
  visits: Visits;
}
