# ResOS

**ResOS** is a lightweight operating dashboard for independent restaurants.

It helps a small team like **Corner Table Cafe** manage operational information that is usually scattered across paper checklists, spreadsheets, and memory.

## Problem Statement

Independent restaurants do not need another enterprise platform just to answer daily manager questions. They need a simple place to see which menu items are helping margin, which compliance tasks are risky, which safety checks are overdue, and which supplier prices changed.

## Customer Jobs

- Make better menu profitability decisions.
- Track compliance renewals, permits, inspections, training, tax, and insurance.
- Run cleanliness and food-safety checklists.
- Track lightweight supplier costs and compare exact unit matches.
- Review mock/manual reputation and profile consistency data without scraping.

## Features

- Landing page and dashboard overview.
- Invite-only login, password reset, and protected dashboard routes.
- Menu Intelligence with editable dish economics, charts, and deterministic recommendations.
- Supplier-linked recipe costing for computed menu ingredient costs.
- Compliance Tracker with editable tasks, add task, mark complete, risk badges, and planning summary.
- Cleanliness & Food Safety Tracker with checklist actions and temperature safety thresholds.
- Supplier Cost Tracking with editable rows, allowed imperial units, price history, and same-unit optimization.
- Mock Reputation/Profile Assistant with manual review summaries, generated reply drafts, and profile mismatch detection.
- Reset Demo Data button.

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
npm run build
```

Add Supabase values to `.env.local` before using authenticated routes:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
```

## Architecture

- React + Vite frontend.
- Supabase Auth provides invite-only email/password access.
- Supabase Postgres stores one shared restaurant workspace in `restaurant_workspaces.data` as JSONB.
- Direct authenticated writes to workspace tables are revoked; data changes go through SECURITY DEFINER RPC functions that enforce membership, role, slug, and JSON-shape checks.
- `src/auth/AuthProvider.jsx` owns session state.
- `src/services/ResosDataProvider.jsx` owns loading, seeding, saving, reset, and CSV import/export.
- `src/services/dataShape.js` validates imported and saved workspace data with strict field allowlists, enum checks, ID checks, string limits, and row limits.
- Data is spreadsheet-shaped so rows can later map to Google Sheets tabs.
- Menu profitability uses effective ingredient cost from either manual menu costs or supplier-linked recipe rows.

## Information Hiding

UI pages and components use the ResOS data provider instead of calling Supabase directly. This keeps the persistence implementation replaceable, so a future version can swap the backend with fewer UI changes.

## Persistence and Backups

ResOS stores the shared Corner Table Cafe workspace in Supabase. On first authenticated load, the app seeds the workspace from `src/data/mockData.js` if the row does not exist and makes that user the workspace admin. Additional users must be added to `restaurant_workspace_members` or through the `add_restaurant_workspace_member` RPC by an admin. The dashboard also supports CSV ZIP export/import for backups, transfers, spreadsheet inspection, and spreadsheet editing. CSV import rejects unexpected files, wrong headers, oversized backups, invalid values, and unsupported fields.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/setup.sql` in the Supabase SQL editor.
3. In Supabase Auth settings, keep email/password enabled and disable public sign-ups for invite-only access.
4. Create or invite the first admin user, then sign in once so the workspace is seeded.
5. Add additional users with `select public.add_restaurant_workspace_member('corner-table-cafe', '<user-uuid>', 'editor');` from an existing admin session, or insert membership rows from the Supabase SQL editor during provisioning.
6. Copy the project URL and anon/publishable key into `.env.local` and Vercel environment variables.

Do not expose a Supabase service-role key in this Vite app. Only the anon/publishable key belongs in `VITE_*` environment variables.

## Vercel Deployment

- Framework preset: Vite.
- Build command: `npm run build`.
- Output directory: `dist`.
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Vercel project environment variables.
- `vercel.json` rewrites all app routes to `index.html` so direct refreshes on `/login`, `/reset-password`, and `/dashboard/*` work.

## Supplier-Linked Recipe Costing

Menu items can use **Manual Cost** or **Auto From Recipe/Suppliers**. Auto-costed items read recipe ingredient rows, match them to supplier items by ingredient and exact imperial unit, and calculate ingredient cost from the cheapest matching supplier or a specific locked supplier. ResOS does not convert units; mismatches are flagged for manual review.

## Why No Scraping

The MVP avoids scraping because restaurant reputation and profile workflows should respect platform terms, official APIs, OAuth consent, and business ownership verification. Demo review/profile data is manual or mock only.

## Future Integrations

- Google Sheets API as the source of truth.
- Google Business Profile API for official profile and review workflows.
- External AI APIs for richer summaries.
- POS/order systems for imported sales signals.

## Demo Script

1. Open the landing page and enter the dashboard.
2. Show the manager action plan.
3. Open Menu Intelligence, select an auto-costed dish, and show the Recipe Cost Builder.
4. Update a supplier price and return to Menu Intelligence to show menu margins change.
5. Run Analyze Menu.
6. Mark a compliance task complete.
7. Show unsafe fridge temperature on Safety and generate a plan.
8. Generate a review reply and profile update plan.
9. Reset demo data.
