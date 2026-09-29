# Nexus

A modern bilingual e-commerce application built with Angular, focused on clean architecture, reusable UI, and a responsive design system.

## Overview

**Nexus** is a modern e-commerce project built to explore and apply modern Angular architecture and development patterns.

The project follows a feature-based structure with reusable components, shared models, services, signals, and a responsive design system.

## Live Demo

🔗 [Nexus E-Commerce](https://commerce-nexus.vercel.app/)

## Tech Stack

- Angular
- TypeScript
- RxJS
- Tailwind CSS
- Angular Signals
- Reactive Forms
- REST API

## Features

- 🌐 Bilingual Arabic / English experience
- 🛍️ Product browsing and product details
- 🔎 Product filtering and sorting
- 📂 Categories and subcategories
- 🏷️ Brands
- ⭐ Product reviews
- 🔐 Authentication
- 🛒 Shopping cart
- 📦 Orders
- 👤 User profile and addresses
- 📱 Responsive mobile-first UI

## Architecture

The application follows a feature-based architecture:

```text
src/app/
├── core/
│   ├── guards/
│   ├── interceptors/
│   ├── services/
│   └── constants/
│
├── shared/
│   ├── components/
│   ├── directives/
│   ├── pipes/
│   └── models/
│
├── features/
│   ├── auth/
│   ├── home/
│   ├── products/
│   ├── categories/
│   ├── subcategories/
│   ├── brands/
│   ├── cart/
│   ├── wishlist/
│   ├── profile/
│   ├── addresses/
│   ├── reviews/
│   └── orders/
│
├── app.routes.ts
├── app.config.ts
├── app.ts
└── app.html