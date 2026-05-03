# Pet Care

A full-stack **pet care** application: an **Expo (React Native)** mobile client and a **Node.js / Express** API backed by **MongoDB**. Pet owners manage pets, vets, appointments, vaccinations, grooming, boarding, diet, and medications; **admins** manage vets, catalogs, and booking approvals.

## Repository layout

| Path | Description |
|------|-------------|
| `pet-care-backend/` | REST API (`server.js`), Mongoose models, JWT auth |
| `pet-care-mobile/` | Expo app (~54), React Navigation |

## Features

### Pet owners (`owner` role)

- **Authentication**: email/password login, OTP-based registration; SMTP optional in development (OTP also returned in JSON only when **not** in production). In production, `EMAIL_USER` / `EMAIL_PASS` must be set or OTP endpoints return an error.
- **Home**: dashboard and pet list (`/pets`).
- **Tabs**: Home, vet booking entry, profile.
- **Modules** (via stack navigation): appointments, vaccinations, grooming, boarding, diet, medications, add pet.

### Administrators (`admin` role)

- Created on backend startup **only when** `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set and that admin does not yet exist ([Environment variables](#environment-variables)).
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

2. **Create `pet-care-backend/.env`** with the variables below (never commit `.env` to git):

   | Variable | Required | Description |
   |----------|----------|-------------|
   | `MONGO_URI` | Yes | MongoDB connection string |
   | `JWT_SECRET` | Yes | Secret for signing JWTs |
   | `PORT` | No | Listening port (default **5000**) |
   | `NODE_ENV` | No | Use `production` to hide stack traces and enforce OTP email |
   | `ADMIN_EMAIL` | For first admin | With `ADMIN_PASSWORD`, seeds one admin account on startup if missing |
   | `ADMIN_PASSWORD` | For first admin | Same as above |
   | `ADMIN_SYNC_ON_START` | No | Set to **`1`** once to create/update the `ADMIN_EMAIL` user’s password and `admin` role on startup; set back to **`0`** after syncing so passwords are not reset every restart |
   | `EMAIL_USER` | Production OTP | Gmail address for OTP mail |
   | `EMAIL_PASS` | Production OTP | Gmail app password or compatible SMTP secret |
   | `ALLOW_INSECURE_GOOGLE_AUTH` | No | Must be **`true`** to allow legacy `POST /auth/google` (unverified payloads). Disabled by default |
   | `MONGO_SKIP_DOH_FALLBACK` | No | Set to **`1`** to skip HTTPS-DNS SRV fallback (only matters for `mongodb+srv://` URIs) |
   | `MONGO_USE_SYSTEM_DNS` | No | Set to **`1`** to skip forcing public DNS before the first SRV connect attempt |
   | `CLOUDINARY_URL` | No | If set (or see below), pet/boarding/vaccine/etc. uploads go to **Cloudinary** and only the HTTPS URL is stored in MongoDB |
   | `CLOUDINARY_CLOUD_NAME` | With key/secret | Alternative to `CLOUDINARY_URL`; use together with `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` |
   | `CLOUDINARY_API_KEY` | With cloud name | Same |
   | `CLOUDINARY_API_SECRET` | With cloud name | Same |

3. **Run**

   ```bash
   npm run dev    # nodemon
   npm start      # node server.js
   ```

   On success you should see MongoDB connected; if both admin env vars are set, a one-time admin seed log; then `Server running on port ...`.

   If you see **`ECONNREFUSED`** on `127.0.0.1:27017`, MongoDB is not running. From `pet-care-backend/`, run **`npm run mongo:up`** (requires [Docker](https://docs.docker.com/get-docker/)) or install/start MongoDB locally, or point **`MONGO_URI`** at Atlas.

   Health check: open `http://localhost:PORT/` — response: `API is running...`.

4. **Admin seed**: runs after DB connect (`seeds/adminSeed.js`) **only when** both `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set. If omitted, the server skips seeding and logs a short warning (no baked-in defaults).

5. **Admin login**: After seeding, open the mobile app **Login** screen and sign in with the same **`ADMIN_EMAIL`** and **`ADMIN_PASSWORD`** defined in `pet-care-backend/.env`.

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

2. **Point the app at your API** (required)

   Create **`pet-care-mobile/.env`** and set **`EXPO_PUBLIC_API_BASE_URL`**; there is no default URL in code, so a missing value fails fast at startup.

   `app.config.js` passes through `extra.apiUrl` from that variable. `src/services/api.js` uses `EXPO_PUBLIC_API_BASE_URL` (or `extra.apiUrl`) as Axios `baseURL` (paths are relative, e.g. `/auth/login`, `/pets`).

   Typical values:

   - **Web / same machine**: `http://127.0.0.1:5000/api`
   - **Android emulator**: `http://10.0.2.2:5000/api`
   - **Physical device**: your PC’s LAN IP, e.g. `http://192.168.x.x:5000/api`

   Example `.env`:

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
- **`querySrv ECONNREFUSED` (Atlas)**: The backend retries by resolving SRV over **HTTPS DNS** (Cloudflare), then connects with a derived `mongodb://` URI—no manual change needed in most cases. If that is blocked, set **`MONGO_SKIP_DOH_FALLBACK=1`** and use Atlas’s **standard** `mongodb://host:27017,...` string instead of `mongodb+srv://`, or fix VPN/firewall/DNS.
- **401 / JWT**: Ensure `JWT_SECRET` matches between issuing tokens and verifying; Authorization header format `Bearer <token>`.
- **Mobile cannot reach API**: Wrong `EXPO_PUBLIC_API_BASE_URL`; use emulator host mapping or LAN IP; keep `/api` suffix consistent with backend mounts.
- **`Missing API configuration` on app launch**: Define `EXPO_PUBLIC_API_BASE_URL` in `pet-care-mobile/.env` and restart Expo.
- **OTP not emailed**: In development only, without SMTP, OTP is logged to the console and returned in JSON (`otp`). In **`NODE_ENV=production`**, SMTP must be configured or OTP sends fail at the API.

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
