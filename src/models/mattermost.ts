export interface MattermostUser {
  id: string;
  create_at: number;
  update_at: number;
  delete_at: number;
  username: string;
  first_name: string;
  last_name: string;
  nickname: string;
  email: string;
  email_verified: boolean;
  auth_service: string;
  roles: string;
  locale: string;
  mfa_active: boolean;
  last_activity_at: string;
}

export interface MattermostChannel {
  name: string;
  display_name: string;
  purpose: string;
  header: string;
  last_post_at: string;
  total_msg_count: string;
}
