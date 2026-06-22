# Calorie Tracker & Macro Dashboard — Full-Stack Setup

A highly optimized, professional multi-tier architecture built with **React, Vite, Tailwind CSS, Express, and TypeScript** tailored to power full-stack metabolic calculators, food logs, and macronutrient tracking.

---

## 📂 Project Architecture

```text
├── server.ts              # Express server entry point with middleware & CORS
├── routes/                # Backend query parameters / API endpoint declarations
│   └── macroRoutes.ts     # Routes mapping for physical calculation targets
├── controllers/           # Payload validations & route orchestration
│   └── macroController.ts # Formulates parsed responses
├── services/              # Pure calculations and business logic calculations
│   └── macroService.ts    # Computes formulas (Mifflin-St Jeor) & structures guide recommendations
├── utils/                 # Back-end formulas & general helpers
│   └── helpers.ts         # Math logic for BMR, TDEE, and macro splits
├── src/                   # Client-Side Application Roots
│   ├── main.tsx           # React virtual tree anchor
│   ├── App.tsx            # High-level entry page shell
│   ├── index.css          # Tailwind CSS global configurations
│   ├── components/        # Isolated reusable atomic layout widgets
│   │   ├── StatusIndicator.tsx
│   │   └── ProjectStructureOverview.tsx
│   ├── pages/             # Layout view dashboards
│   │   └── DashboardSetup.tsx
│   ├── hooks/             # Custom lifecycle handlers 
│   │   └── useServerStatus.ts
│   ├── services/          # External REST fetch client
│   │   └── api.ts
│   └── utils/             # Front-end utility text and metrics formatters
│       └── formatters.ts
└── package.json           # Transpilation command, dependencies and script managers
```

---

## 🛠️ Tech Stack & Configurations

### Frontend
- **React (v19) + Vite (v6):** Fast development bundling and lightning-fast client-side routing.
- **Tailwind CSS (v4):** Native utility styling for layout consistency.
- **Lucide-React:** Vector-based responsive layout iconography.
- **Custom React Hooks:** Clean, responsive state management mapping background API telemetry check cycles.

### Backend
- **Express (v4):** Extensible middleware routing pipeline.
- **TypeScript (TypeScript-native execution via tsx):** Eliminates complex compilation delays during development sandbox testing.
- **CORS Configured:** Out-of-the-box pre-flight handling allowing seamless local API access.
- **Vite Integration:** Dynamically mounts Vite's middleware in development while safely serving static bundles in production.

---

## 🚀 Run & Build Scripts

These commands are fully declared in `package.json` for smooth transitions.

### 1. Run Development Environment
Starts the unified Express server process, wrapping Vite as development middleware.
```bash
npm run dev
```

### 2. Build Production Bundles
Compiles static UI assets via Vite, and bundles the Express application file into a standalone, optimized ESModule executable (located at `dist/server.cjs` via esbuild).
```bash
npm run build
```

### 3. Run Production Server
Launches the standalone bundled production server using native node command.
```bash
npm run start
```

---

## 🥗 How to Extend

1. **Adding Database Persistence:**
   Add a database database adapter in `/services/` (e.g. `firebase-integration` or drizzle for SQL database) and call database transactions directly in your controller layer.
   
2. **Exposing More Micro-Calculators:**
   Register more formula configurations in backend services (e.g., Katch-McArdle or Harris-Benedict mathematical models) and mount new routes inside `/routes/macroRoutes.ts`.

3. **Integrating Food Barcode Scanners / Foods API:**
   To securely query third-party ingredients databases, proxy requests through the Express Server. Keep secret api keys declared in `.env` safe from the client-side browser bundle.
