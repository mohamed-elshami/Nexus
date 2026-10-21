export interface AuthUser {
  name: string;
  email: string;
  role: string;
}

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

export interface UpdateLoggedUserPasswordPayload {
  currentPassword: string;
  password: string;
  rePassword: string;
}

export interface AuthSessionResponse {
  message?: string;
  token: string;
  user: AuthUser;
}

export interface AuthMessageResponse {
  statusMsg?: string;
  status?: string;
  message: string;
}
