# Pet Care

A full-stack **pet care** application: an **Expo (React Native)** mobile client and a **Node.js / Express** API backed by **MongoDB**. Pet owners manage pets, vets, appointments, vaccinations, grooming, boarding, diet, and medications; **admins** manage vets, catalogs, and booking approvals.

## Repository layout

| Path | Description |
|------|-------------|
| `pet-care-backend/` | REST API (`server.js`), Mongoose models, JWT auth |
| `pet-care-mobile/` | Expo app (~54), React Navigation |

## Features

### Pet owners (`owner` role)

- **Authentication**: email/password login, OTP-based registration and flows; optional Gmail OTP delivery (falls back to console + JSON `otp` in development when SMTP is unset).
- **Home**: dashboard and pet list (`/pets`).
- **Tabs**: Home, vet booking entry, profile.
- **Modules** (via stack navigation): appointments, vaccinations, grooming, boarding, diet, medications, add pet.

### Administrators (`admin` role)

- Seeded automatically on backend startup if no admin exists (see [Environment variables](#environment-variables)).
- Dashboard and management for: vets and schedules, appointment approvals, vaccine records, grooming services and bookings, boarding rooms and bookings, diet and medication catalogs, booking approvals.

### API capabilities (high level)

- Static file hosting for uploads under `/uploads`.
- Role-based JWT protection (`protect`, `admin`, `vetOrAdmin` in `middleware/authMiddleware.js`).

## Tech stack

**Backend**: Express 5, Mongoose (MongoDB), bcryptjs, JWT, cors, multer, nodemailer (Gmail SMTP when configured).

**Mobile**: Expo ~54, React 19 / React Native, React Navigation (native stack + bottom tabs), Axios, `@react-native-community/datetimepicker`, `expo-image-picker`.

## Prerequisites

- **Node.js** (LTS recommended)
- **MongoDB** URI (Atlas or local `mongod`)
- **npm** (or compatible package manager)

For physical devices testing the app, the API must be reachable on your LAN or via tunnel; localhost on the phone does not reach your PC.

## Backend setup (`pet-care-backend`)

1. **Install dependencies**

   ```bash
   cd pet-care-backend
   npm install
   ```

2. **Create `.env`** in `pet-care-backend/` (never commit secrets; `.env` is gitignored):

   | Variable | Required | Description |
   |----------|----------|-------------|
   | `MONGO_URI` | Yes | MongoDB connection string |
   | `JWT_SECRET` | Yes | Secret for signing JWTs |
   | `PORT` | No | Listening port (default **5000**) |
   | `NODE_ENV` | No | Use `production` to hide stack traces in errors |
   | `ADMIN_EMAIL` | No | Seed admin email (default `admin@petcare.com`) |
   | `ADMIN_PASSWORD` | No | Seed admin password (default `admin123`) |
   | `EMAIL_USER` | No | Gmail address for OTP mail |
   | `EMAIL_PASS` | No | Gmail app password (or compatible SMTP credential) |

3. **Run**

   ```bash
   npm run dev    # nodemon
   npm start      # node server.js
   ```

   On success you should see MongoDB connected, optional admin seed logs, and `Server running on port ...`.

   Health check: open `http://localhost:PORT/` — response: `API is running...`.

4. **Admin seed**: runs automatically inside `server.js` after DB connect (`seeds/adminSeed.js`). Override credentials with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

Optional script:

```bash
npm run seed-admin
```

(Ensure `.env` is loaded the same way as your normal start command; the primary flow is startup seeding.)

## Mobile app setup (`pet-care-mobile`)

1. **Install dependencies**

   ```bash
   cd pet-care-mobile
   npm install
   ```

2. **Point the app at your API**

   `app.config.js` sets:

   ```text
   extra.apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:5000/api"
   ```

   `src/services/api.js` uses `EXPO_PUBLIC_API_BASE_URL` or that `extra.apiUrl` as Axios `baseURL` (paths are relative, e.g. `/auth/login`, `/pets`).

   Examples:

   - **Web / same machine**: `http://localhost:5000/api` often works as default.
   - **Android emulator**: try `http://10.0.2.2:5000/api` instead of `localhost`.
   - **Physical device**: use your computer’s LAN IP, e.g. `http://192.168.x.x:5000/api`; ensure firewall allows the port.

   Set in `.env` next to `app.config.js` (Expo picks up `EXPO_PUBLIC_*`):

   ```env
   EXPO_PUBLIC_API_BASE_URL=http://YOUR_HOST:5000/api
   ```

3. **Start Expo**

   ```bash
   npm start
   npm run android
   npm run ios
   npm run web
   ```

Cleartext HTTP is enabled for Android in config for easier local development; tighten this for production builds.

## API route map

Mounted under `/api`:

| Prefix | Purpose |
|--------|---------|
| `/api/auth` | Registration, OTP, login, JWT issuance |
| `/api/pets` | Pets CRUD / linkage to owner |
| `/api/admin` | Admin-only operations |
| `/api/vets` | Vets and schedules |
| `/api/appointments` | Appointments / vet bookings |
| `/api/vaccines` | Vaccine catalog and records |
| `/api/grooming` | Grooming services and bookings |
| `/api/boarding` | Boarding rooms and bookings |
| `/api/diet` | Diet / feeding records |
| `/api/medications` | Medication records |

See `pet-care-backend/server.js` for mounted routers and individual `routes/*.js` files for exact endpoints.

## Troubleshooting

- **MongoDB errors**: Confirm `MONGO_URI` is correct and the cluster allows your IP (Atlas network access).
- **401 / JWT**: Ensure `JWT_SECRET` matches between issuing tokens and verifying; Authorization header format `Bearer <token>`.
- **Mobile cannot reach API**: Wrong `EXPO_PUBLIC_API_BASE_URL`; use emulator host mapping or LAN IP; keep `/api` suffix consistent with backend mounts.
- **OTP not emailed**: Without `EMAIL_USER` / `EMAIL_PASS`, OTP is logged to the server console and returned in the JSON body in development (`otp` field) — use that value in the OTP screen.

## Scripts summary

**Backend**

- `npm start` — production-style run
- `npm run dev` — watch mode
- `npm run seed-admin` — standalone admin seed

**Mobile**

- `npm start` — Expo dev server
- `npm run android` / `npm run ios` / `npm run web` — platform targets

---

This project is structured as two deployable halves: run the backend where MongoDB is available, configure the Expo client’s API base URL to that host, then build or run clients as needed.
