# Frontend Service - E-Commerce Recommendation System

Modern React 19 + TypeScript frontend with Redux Toolkit, RTK Query, and TailwindCSS 4.

## 🏗️ Architecture

```
services/frontend/
├── public/                    # Static assets
│   ├── favicon-*.png         # Favicon sizes
│   ├── manifest.json         # PWA manifest
│   ├── robots.txt            # SEO configuration
│   └── logo.png              # App logo
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── admin/           # Admin-specific components
│   │   ├── analytics/       # Analytics widgets
│   │   ├── auth/            # Auth forms & guards
│   │   ├── cart/            # Shopping cart components
│   │   ├── checkout/        # Checkout flow
│   │   ├── common/          # Shared components
│   │   ├── error/           # Error boundaries
│   │   ├── layout/          # Layout components
│   │   ├── product/         # Product components
│   │   └── ui/              # Base UI components
│   ├── config/              # Configuration
│   │   └── env.ts           # Environment config
│   ├── constants/           # Application constants
│   │   ├── routes.ts        # Route paths
│   │   ├── permissions.ts   # Permission constants
│   │   └── index.ts         # Barrel export
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts       # Authentication hook
│   │   ├── useDebounce.ts   # Debounce hook
│   │   └── index.ts         # Barrel export
│   ├── pages/               # Page components
│   │   ├── admin/           # Admin pages
│   │   ├── auth/            # Auth pages
│   │   ├── checkout/        # Checkout page
│   │   ├── product/         # Product pages
│   │   ├── user/            # User profile pages
│   │   └── HomePage.tsx     # Landing page
│   ├── routes/              # Routing configuration
│   │   ├── AdminRouter.tsx  # Admin routes
│   │   ├── ProtectedRoute.tsx
│   │   └── index.tsx        # Main router
│   ├── store/               # Redux state management
│   │   ├── api/             # RTK Query API slices
│   │   │   ├── adminApi.ts  # Admin endpoints
│   │   │   ├── authApi.ts   # Auth endpoints
│   │   │   ├── cartApi.ts   # Cart endpoints
│   │   │   ├── orderApi.ts  # Order endpoints
│   │   │   ├── productApi.ts # Product endpoints
│   │   │   └── ...
│   │   ├── slices/          # Redux slices
│   │   │   ├── authSlice.ts # Auth state
│   │   │   └── cartSlice.ts # Cart state
│   │   ├── hooks.ts         # Typed Redux hooks
│   │   └── store.ts         # Store configuration
│   ├── types/               # TypeScript types
│   │   ├── api.types.ts     # API response types
│   │   ├── auth.types.ts    # Auth types
│   │   ├── product.types.ts # Product types
│   │   └── index.ts         # Barrel export
│   ├── utils/               # Utility functions
│   │   ├── formatting.ts    # String/number formatting
│   │   ├── validation.ts    # Form validation
│   │   ├── errorHandling.ts # Error utilities
│   │   └── index.ts         # Barrel export
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Application entry
│   └── index.css            # Global styles (Tailwind)
├── __tests__/               # Test files
├── .prettierrc              # Prettier config
├── .prettierignore          # Prettier ignore
├── eslint.config.js         # ESLint flat config
├── tsconfig.json            # TypeScript config
├── tsconfig.app.json        # App TypeScript config
├── tsconfig.node.json       # Node TypeScript config
├── vite.config.ts           # Vite configuration
├── package.json             # Dependencies & scripts
├── Dockerfile               # Container configuration
└── .dockerignore            # Docker ignore (symlink)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Backend service running on `http://localhost:8000`

### Option 1: Docker (Recommended)

```bash
# From root directory
docker-compose up frontend

# Frontend will be available at http://localhost:5173
```

### Option 2: Local Development

```bash
cd services/frontend

# Install dependencies
npm install

# Set up environment variables (optional)
# Copy root .env.example and add VITE_ prefixed variables if needed

# Start development server
npm run dev

# Open http://localhost:5173 in browser
```

## 📋 Available Scripts

```bash
# Development
npm run dev              # Start Vite dev server (HMR enabled)
npm run build            # Build for production
npm run preview          # Preview production build locally

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors automatically
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run type-check       # TypeScript type checking

# Testing
npm test                 # Run tests in watch mode
npm run test:ui          # Run tests with UI
npm run test:coverage    # Run tests with coverage report

# All Checks
npm run validate         # Run type-check + lint + format + test
```

## 🛠️ Tech Stack

### Core Framework
- **React 19.1.0** - Latest React with modern features
- **TypeScript 5.8.3** - Type-safe JavaScript
- **Vite 6.3.5** - Lightning-fast build tool with HMR

### State Management
- **Redux Toolkit 2.8.2** - Modern Redux with less boilerplate
- **RTK Query** - Powerful data fetching & caching
- **Redux Persist** - State persistence (optional)

### Styling
- **TailwindCSS 4.1.7** - Utility-first CSS framework
- **DaisyUI 5.0.43** - Tailwind component library
- **Framer Motion 12.15.0** - Animation library
- **Lucide React 0.511.0** - Icon library

### Routing
- **React Router 7.6.1** - Declarative routing
- **Nested routing** - Admin panel routes
- **Protected routes** - Auth guards

### Forms & Validation
- **React Hook Form 7.61.0** - Performant form handling
- **Yup 1.6.1** - Schema validation
- **Zod 3.25.46** - TypeScript-first validation
- **@hookform/resolvers 5.1.1** - Validation resolvers

### UI Components
- **@headlessui/react 2.2.4** - Unstyled accessible components
- **@tanstack/react-table 8.21.3** - Powerful table library
- **React Hot Toast 2.5.2** - Beautiful notifications
- **React Markdown 10.1.0** - Markdown renderer

### Data Visualization
- **Recharts 3.1.0** - Chart library for React

### Utilities
- **Axios 1.9.0** - HTTP client
- **date-fns 2.30.0** - Date manipulation
- **clsx 2.1.1** - Conditional classNames
- **tailwind-merge 3.3.0** - Merge Tailwind classes

### Testing
- **Vitest** - Fast unit test framework
- **@testing-library/react** - React testing utilities
- **jsdom** - Browser environment simulation

### Development Tools
- **ESLint 9.25.0** - Code linting (flat config)
- **Prettier** - Code formatting
- **TypeScript ESLint 8.30.1** - TypeScript linting

## 🗺️ Key Features

### User Features
- **Product Browsing** - Grid/list view with filters
- **Search** - Real-time search with autocomplete
- **Recommendations** - Personalized ML-powered suggestions
- **Shopping Cart** - Add/update/remove items
- **Checkout** - Multi-step checkout process
- **Order History** - View past orders
- **Wishlist** - Save favorite products
- **User Profile** - Manage account details

### Admin Features
- **Dashboard** - Analytics & metrics overview
- **Product Management** - CRUD operations
- **Order Management** - View & update orders
- **User Management** - View users & activity
- **ML Model Control** - Train & monitor models
- **User Segmentation** - Create & analyze segments
- **Analytics** - Revenue, conversion, retention
- **Settings** - System configuration

### Technical Features
- **JWT Authentication** - Secure token-based auth
- **Protected Routes** - Role-based access control
- **Optimistic Updates** - Instant UI feedback
- **Error Boundaries** - Graceful error handling
- **Loading States** - Skeleton screens
- **Responsive Design** - Mobile-first approach
- **Dark Mode** - Theme switching (optional)
- **PWA Ready** - Manifest & service worker ready

## 🎯 Path Aliases

Configured in `tsconfig.app.json` and `vite.config.ts`:

```typescript
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks';
import { ProductCard } from '@/components/product';
import { authApi } from '@/store/api';
import type { User } from '@/types';
import { formatCurrency } from '@/utils';
import { ROUTES } from '@/constants';
import env from '@/config/env';
```

Available aliases:
- `@/*` → `src/*`
- `@/components/*` → `src/components/*`
- `@/hooks/*` → `src/hooks/*`
- `@/pages/*` → `src/pages/*`
- `@/store/*` → `src/store/*`
- `@/types/*` → `src/types/*`
- `@/utils/*` → `src/utils/*`
- `@/constants/*` → `src/constants/*`
- `@/config/*` → `src/config/*`
- `@/assets/*` → `src/assets/*`

## 🔐 Authentication Flow

```typescript
// 1. Login
const { data } = await authApi.endpoints.login.initiate({
  email: 'user@example.com',
  password: 'password123'
});

// 2. Token stored in Redux + localStorage
dispatch(setCredentials({ user: data.user, token: data.access_token }));

// 3. Auto-attached to all API requests
const baseQuery = fetchBaseQuery({
  baseUrl: env.apiUrl,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// 4. Protected routes check auth state
<ProtectedRoute>
  <AdminDashboard />
</ProtectedRoute>
```

## 📡 API Integration (RTK Query)

### Basic Usage

```typescript
// Fetch products
const { data: products, isLoading, error } = useGetProductsQuery({
  page: 1,
  limit: 20,
  category: 'electronics'
});

// Create product (admin)
const [createProduct, { isLoading }] = useCreateProductMutation();
await createProduct(productData);

// Automatic caching & invalidation
const productApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (params) => `/products?${new URLSearchParams(params)}`,
      providesTags: ['Products']
    }),
    createProduct: builder.mutation({
      query: (product) => ({
        url: '/products',
        method: 'POST',
        body: product
      }),
      invalidatesTags: ['Products'] // Auto-refetch products
    })
  })
});
```

### Available API Slices

- **authApi** - Login, register, logout, refresh token
- **productApi** - Products, categories, recommendations
- **cartApi** - Cart operations
- **orderApi** - Order management
- **adminApi** - Admin-only endpoints (dashboard, analytics, ML)
- **recommendationApi** - ML recommendations

## 🎨 Styling Approach

### TailwindCSS + DaisyUI

```tsx
// Using utility classes
<button className="btn btn-primary">
  Click Me
</button>

// Custom component with Tailwind
<div className="flex items-center gap-4 p-4 bg-base-100 rounded-lg shadow-md">
  <Icon className="w-6 h-6 text-primary" />
  <span className="text-lg font-semibold">Product Name</span>
</div>

// Conditional classes with clsx
import { clsx } from 'clsx';

<div className={clsx(
  'btn',
  isActive && 'btn-active',
  isDisabled && 'btn-disabled'
)}>
```

### Theme Configuration

DaisyUI themes configured in `tailwind.config.js`:
- Light theme (default)
- Dark theme (optional)
- Custom brand colors

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Coverage report
npm run test:coverage

# Test specific file
npm test -- ProductCard.test.tsx
```

### Example Test

```typescript
import { render, screen } from '@testing-library/react';
import { ProductCard } from '@/components/product/ProductCard';

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    const product = {
      id: 1,
      name: 'Test Product',
      price: 99.99
    };
    
    render(<ProductCard product={product} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });
});
```

## 🔧 Configuration

### Environment Variables

Create `.env` in root directory (optional overrides):

```bash
# API Configuration - Do NOT include /api/v1 (added automatically)
VITE_API_BASE_URL=http://localhost:8000

# Optional overrides
VITE_API_VERSION=v1
VITE_APP_NAME=E-Commerce Platform
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ML_RECOMMENDATIONS=true
```

### Default Configuration

Defined in `src/config/env.ts`:
- API URL: `http://localhost:8000/api/v1`
- All features enabled for POC
- Development mode detection
- Type-safe configuration access

## 🚀 Development Workflow

### Adding New Component

```bash
# Create component file
touch src/components/common/MyComponent.tsx

# Create test file
touch src/components/__tests__/MyComponent.test.tsx

# Export from barrel
echo "export { MyComponent } from './common/MyComponent';" >> src/components/index.ts
```

### Adding New Page

```typescript
// 1. Create page component
// src/pages/mypage/MyPage.tsx
export const MyPage = () => {
  return <div>My Page Content</div>;
};

// 2. Export from pages index
// src/pages/index.ts
export { MyPage } from './mypage/MyPage';

// 3. Add route
// src/routes/index.tsx
import { MyPage } from '@/pages';

<Route path="/my-page" element={<MyPage />} />
```

### Adding API Endpoint

```typescript
// src/store/api/myApi.ts
import { apiSlice } from './apiSlice';

export const myApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getItems: builder.query({
      query: () => '/items',
      providesTags: ['Items']
    }),
    createItem: builder.mutation({
      query: (item) => ({
        url: '/items',
        method: 'POST',
        body: item
      }),
      invalidatesTags: ['Items']
    })
  })
});

export const { useGetItemsQuery, useCreateItemMutation } = myApi;
```

## 🐛 Debugging

### Redux DevTools

```typescript
// Redux DevTools automatically enabled in development
// Chrome Extension: Redux DevTools
// Inspect state, actions, and time-travel debugging
```

### React DevTools

```bash
# Install browser extension
# Chrome: React Developer Tools
# Firefox: React Developer Tools

# Inspect component tree, props, state, and hooks
```

### Network Debugging

```typescript
// RTK Query provides excellent logging
// Enable in Redux DevTools middleware tab
// See all API requests, responses, cache status
```

## 📦 Build & Deployment

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Output in dist/ directory
```

### Docker Deployment

```bash
# Build image
docker build -t ecom-frontend .

# Run container
docker run -p 5173:5173 ecom-frontend

# Or use docker-compose
docker-compose up frontend
```

### Build Optimization

Vite automatically:
- Code splitting
- Tree shaking
- Asset minification
- CSS optimization
- Image optimization

## 🔒 Security

- **XSS Protection** - React auto-escapes content
- **CSRF Protection** - Token-based auth
- **Content Security Policy** - Configured headers
- **Secure Storage** - No sensitive data in localStorage
- **HTTPS Only** - Production requirement
- **Input Validation** - Client + server validation
- **Role-Based Access** - Protected routes & components

## 📚 Related Documentation

- [Frontend API Patterns](../../docs/FRONTEND_API_PATTERNS.md)
- [Frontend Testing Guide](../../docs/FRONTEND_TESTING.md)
- [Architecture Overview](../../docs/architecture.md)
- [Development Guide](../../docs/development.md)

## 🆘 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or change port in package.json
"dev": "vite --port 3000"
```

**Module Not Found**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or rebuild
docker-compose build frontend
```

**Type Errors**
```bash
# Regenerate TypeScript cache
npm run type-check

# Check tsconfig.json paths
# Restart TypeScript server in IDE
```

**API Connection Error**
```bash
# Check backend is running
curl http://localhost:8000/health

# Verify VITE_API_BASE_URL in .env
echo $VITE_API_BASE_URL

# Check CORS configuration in backend
```

**Build Fails**
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Clean build
rm -rf dist && npm run build
```

## 📝 Notes

- This is a **POC implementation** optimized for development
- For production, consider:
  - Multi-stage Docker builds (smaller images)
  - CDN for static assets
  - Service worker for offline support
  - Code splitting optimization
  - Bundle size analysis
  - Performance monitoring (Sentry, LogRocket)
  - A/B testing framework
  - Analytics integration (Google Analytics, Mixpanel)
  - Error tracking (Sentry)
  - Feature flags system

## 🎯 Code Quality Standards

- **TypeScript Strict Mode** - Enabled
- **ESLint Rules** - React hooks, React refresh
- **Prettier** - Consistent formatting
- **Path Aliases** - No relative imports beyond one level
- **Barrel Exports** - Clean import statements
- **Component Organization** - Logical grouping
- **Test Coverage** - Aim for >80%

---

**Built with ❤️ using React + Vite + TypeScript**
