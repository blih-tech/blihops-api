import type { AuthRole } from '../../shared/middlewares/auth.js';

export type InviteBody = {
  email: string;
  name: string;
  role: AuthRole;
};

export type InviteResult = {
  invitedEmail: string;
  role: AuthRole;
};

export type AcceptInviteBody = {
  token: string;
  newPassword: string;
};

export type AcceptInviteResult = {
  activated: boolean;
};

export type SessionTokenResult = {
  token: string;
};
