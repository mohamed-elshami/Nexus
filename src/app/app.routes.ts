import { Routes } from '@angular/router';
import { PageMetaData } from './core/seo/page-meta';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { WebsiteLayout } from './layouts/website-layout/website-layout';

const authRobots = 'noindex,follow';

export const routes: Routes = [
  {
    path: '',
    component: WebsiteLayout,
    children: [
      {
        path: '',
        data: {
          pageMeta: {
            title: 'Next-Gen Shopping Experience',
            description:
              'Immerse yourself in precision-engineered electronics, flagship smartphones, and runway fashion. Unrivaled speed, certified genuine curation, delivered to your doorstep.',
          } satisfies PageMetaData,
        },
        loadComponent: () => import('./features/home/pages/home/home').then((m) => m.Home),
      },
      {
        path: 'categories',
        data: {
          pageMeta: {
            title: 'Explore All Categories & Departments',
            description:
              'Navigate through our collection of electronics, fashion, home living, and daily lifestyle essentials from official brand distributors.',
          } satisfies PageMetaData,
        },
        loadComponent: () =>
          import('./features/categories/pages/categories/categories').then((m) => m.Categories),
      },
      {
        path: 'brands',
        data: {
          pageMeta: {
            title: 'Official Brand Stores & Flagship Partners',
            description:
              'Shop 100% genuine products directly from verified international and regional flagships with manufacturer warranty, sealed packaging, and direct doorstep support.',
          } satisfies PageMetaData,
        },
        loadComponent: () => import('./features/brands/pages/brands/brands').then((m) => m.Brands),
      },
      {
        path: 'products',
        data: {
          pageMeta: {
            title: 'Products',
            description:
              'Browse the Nexus catalog and narrow it by category, brand, price, and rating.',
          } satisfies PageMetaData,
        },
        loadComponent: () =>
          import('./features/products/pages/products/products').then((m) => m.Products),
      },
      {
        path: 'products/:id',
        data: {
          pageMeta: {
            title: 'Product',
            description: 'View the price, photos, and reviews for this Nexus product.',
          } satisfies PageMetaData,
        },
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
        data: {
          pageMeta: {
            title: 'Welcome back to Nexus',
            description:
              'Sign in to access your saved addresses, track live orders, and unlock member rewards.',
            robots: authRobots,
          } satisfies PageMetaData,
        },
        loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.Login),
      },
      {
        path: 'register',
        data: {
          pageMeta: {
            title: 'Create your Nexus account',
            description:
              'Add your details to save addresses, track live orders, and unlock member rewards.',
            robots: authRobots,
          } satisfies PageMetaData,
        },
        loadComponent: () =>
          import('./features/auth/pages/register/register').then((m) => m.Register),
      },
      {
        path: 'forgot-password',
        data: {
          pageMeta: {
            title: 'Reset Your Password',
            description:
              'Verify your identity via the one-time passcode and establish a new password for your Nexus account.',
            robots: authRobots,
          } satisfies PageMetaData,
        },
        loadComponent: () =>
          import('./features/auth/pages/forgot-password/forgot-password').then(
            (m) => m.ForgotPassword,
          ),
      },
    ],
  },
];
