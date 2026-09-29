import { Routes } from '@angular/router';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { WebsiteLayout } from './layouts/website-layout/website-layout';

export const routes: Routes = [
  {
    path: '',
    component: WebsiteLayout,
    children: [
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/pages/products/products').then(
            (m) => m.Products,
          ),
      },
    ],
  },
  {
    path: 'auth',
    component: AuthLayout,
    children: [],
  },
];
