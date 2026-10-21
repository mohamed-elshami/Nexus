import { Routes } from '@angular/router';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { WebsiteLayout } from './layouts/website-layout/website-layout';

export const routes: Routes = [
  {
    path: '',
    component: WebsiteLayout,
    children: [
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/pages/categories/categories').then((m) => m.Categories),
      },
      {
        path: 'brands',
        loadComponent: () => import('./features/brands/pages/brands/brands').then((m) => m.Brands),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/pages/products/products').then((m) => m.Products),
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./features/products/pages/product-details/product-details').then(
            (m) => m.ProductDetails,
          ),
      },
    ],
  },
  {
    path: '',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.Login),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/pages/register/register').then((m) => m.Register),
      },
    ],
  },
];
