export interface User {
  name: string;
  email: string;
  role: string;
  phone: string;
  _id: string;
  wishlist: string[];
  addresses: string[];
}

export interface UserResponse {
  data: User;
}

export interface UpdateLoggedUserPasswordPayload {
  currentPassword: string;
  password: string;
  rePassword: string;
}

export interface UpdateLoggedUserPasswordResponse {
  message?: string;
  token?: string;
  user?: User;
}
