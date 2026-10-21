export const API_ENDPOINTS = {
  auth: {
    signup: '/api/v1/auth/signup',
    signin: '/api/v1/auth/signin',
    forgotPassword: '/api/v1/auth/forgotPasswords',
    verifyResetCode: '/api/v1/auth/verifyResetCode',
    resetPassword: '/api/v1/auth/resetPassword',
  },
  products: {
    list: '/api/v1/products',
    byId: (id: string) => `/api/v1/products/${id}`,
  },
  categories: {
    list: '/api/v1/categories',
    byId: (id: string) => `/api/v1/categories/${id}`,
  },
  subcategories: {
    list: '/api/v1/subcategories',
    byId: (id: string) => `/api/v1/subcategories/${id}`,
    byCategory: (categoryId: string) =>
      `/api/v1/categories/${categoryId}/subcategories`,
  },
  users: {
    changePassword: '/api/v1/users/changeMyPassword',
  },
  brands: {
    list: '/api/v1/brands',
    byId: (id: string) => `/api/v1/brands/${id}`,
  },
  reviews: {
    list: '/api/v1/reviews',
    byId: (id: string) => `/api/v1/reviews/${id}`,
    byProduct: (productId: string) => `/api/v1/products/${productId}/reviews`,
  },
};
