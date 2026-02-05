export interface User {
  id: string;
  linkedin_id: string;
  name: string | null;
  email: string | null;
  profile_picture: string | null;
  headline: string | null;
  linkedin_access_token: string | null; // Encrypted
  linkedin_refresh_token: string | null; // Encrypted
  token_expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
}

export interface CreateUserDTO {
  linkedin_id: string;
  name?: string;
  email?: string;
  profile_picture?: string;
  headline?: string;
  linkedin_access_token?: string;
  linkedin_refresh_token?: string;
  token_expires_at?: Date;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  profile_picture?: string;
  headline?: string;
  linkedin_access_token?: string;
  linkedin_refresh_token?: string;
  token_expires_at?: Date;
  last_login_at?: Date;
}
