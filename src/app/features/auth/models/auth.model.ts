import { User } from '../../user/models/user.model';

export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
  rePassword: string;
  phone: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyResetCodePayload {
  resetCode: string;
}

export interface ResetPasswordPayload {
  email: string;
  newPassword: string;
}

export interface AuthSessionResponse {
  message?: string;
  token: string;
  user: User;
}

export interface AuthMessageResponse {
  statusMsg?: string;
  status?: string;
  message: string;
}

export interface VerifiedToken {
  id: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

export interface VerifyTokenResponse {
  message: string;
  decoded: VerifiedToken;
}
