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
npm run dev
npm run build
```

## Architecture

- React + Vite frontend.
- `src/services/dataStore.js` is the public persistence boundary.
- `src/services/localStorageStore.js` is the MVP persistence adapter.
- Data is spreadsheet-shaped so rows can later map to Google Sheets tabs.
- `src/services/googleSheetsStore.js` documents the future Google Sheets adapter.
- Menu profitability uses effective ingredient cost from either manual menu costs or supplier-linked recipe rows.

## Information Hiding

UI pages and components call `dataStore` functions only. They do not call `localStorage` directly. This keeps the persistence implementation replaceable, so a future version can swap in Google Sheets or another backend with fewer UI changes.

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
