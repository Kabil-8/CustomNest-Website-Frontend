# TheCustomNest — Frontend

A production-quality crochet e-commerce storefront built with **React + TypeScript + Vite + Tailwind CSS + Framer Motion**, using the client's real product photography.

## Quick start

```bash
npm install
npm run dev
```

Visit the printed local URL (usually `http://localhost:5173`).

To build for production:

```bash
npm run build
npm run preview
```

## Demo mode (works out of the box, no backend required)

This app ships with a **mock backend** (`src/lib/api.ts`) that simulates a real REST API using `localStorage`, with realistic network delay. Every function is shaped exactly like a real `fetch()` call, so you can browse, register, sign in, add to cart, checkout, and use the admin dashboard immediately — no database setup needed.

**Admin login** (`/admin/login`):
- Email: `ashwithaksamy@gmail.com`
- Password: `Ashwitha@7912`

This account is seeded automatically on first load, for demo purposes only. **Do not ship this credential to production** — see "Going live" below.

## Going live (connecting the real backend)

The companion `/backend` folder is a production-ready Node.js + Express + MongoDB API with real JWT auth, bcrypt password hashing, and role-based access control. To switch the frontend from demo mode to the live API:

1. Replace the contents of `src/lib/api.ts` with real `fetch('/api/...', { credentials: 'include' })` calls matching the routes documented in `backend/README.md`. The function signatures (`auth.login`, `orders.create`, `customOrders.submit`, etc.) are already shaped to match the backend controllers 1:1 — this is intentionally the *only* file that needs to change.
2. Remove the `seedAdmin()` call and the demo credential.
3. Set `VITE_API_URL` (or your preferred env convention) and point requests at your deployed API origin.

## Project structure

```
src/
  components/     Reusable UI (Navbar, Footer, ProductCard, AuthModal, CartDrawer, ui.tsx primitives, etc.)
  context/        React context providers (Auth, AuthGate, Cart, Wishlist, Toast)
  data/           Product & category catalog, generated from the client's photos (see manifest.json at repo root)
  lib/            api.ts (mock backend), utils.ts
  pages/          Route-level pages, including pages/account/* and pages/admin/*
  types/          Shared TypeScript types
public/images/    Curated, optimized product & category photography
```

## Design system

- **Colors**: rose/blush palette + warm white/ivory, defined in `tailwind.config.js` (`rose-50…900`, `cream`, `ivory`, `charcoal`, `muted`, `line`)
- **Typography**: Fraunces (display/headings) + Manrope (body), loaded via Google Fonts in `index.html`
- **Signature motif**: a hand-stitched "running thread" SVG divider (`StitchDivider` in `components/ui.tsx`) used throughout to tie the UI back to crochet/needlework
- No dark mode, no glassmorphism, no browser `alert()` — all states (loading/empty/error) are custom-designed
- Respects `prefers-reduced-motion`

## Key behaviors implemented per spec

- **Login-required cart**: `useCart().addItem()` and `useWishlist().toggle()` route through `AuthGateContext.requireAuth()`. If the visitor isn't signed in, the `AuthModal` opens with a clear explanation; on successful sign-in/registration, the original action (add to cart / save to wishlist) automatically completes and the person lands back where they were.
- **Admin route protection**: `/admin/*` is wrapped in `RequireAdmin`, which checks `user.role === 'admin'` client-side for UX — but this is **not** the real security boundary. The backend re-checks the JWT + role on every admin request (see `backend/src/middleware/auth.js`).
- **Order tracking**: `OrderTimeline` renders Pending → Confirmed → Processing → Shipped → Delivered, with a distinct cancelled state.
