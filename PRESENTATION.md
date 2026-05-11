# ResOS

**A lightweight operating dashboard for independent restaurants.**

Team members:
- Member 1: Aarav
- Member 2: Allison

## Mock Customer

Corner Table Cafe, a neighborhood American cafe managed by a small team.

## Problem Statement

Small restaurants run on paper checklists, spreadsheets, and memory. That makes menu decisions, compliance tracking, food safety, and supplier cost awareness harder than they need to be.

## Customer Sub-Jobs Chosen

- Decide which menu items to keep, promote, reprice, or simplify.
- Track permits, inspections, renewals, training, tax, and insurance.
- Run daily cleanliness and food-safety checks.
- Compare supplier costs without building inventory software.
- Link recipe ingredients to supplier costs for computed menu profitability.
- Review manual reputation/profile data for future official API workflows.

## Outcomes and KPIs

- Fewer overdue compliance tasks.
- Fewer missed food safety checks.
- Faster computed menu margin decisions.
- Clear same-unit supplier savings opportunities.
- Better response process for urgent reviews.

## 1-Minute Demo Script

1. Start on the ResOS landing page and open the dashboard.
2. Explain the manager action plan as the daily operating view.
3. Open Menu Intelligence and show dish profitability recommendations.
4. Show the Recipe Cost Builder and explain cheapest vs specific supplier modes.
5. Open Suppliers and update a supplier price to create a history row.
6. Return to Menu Intelligence to show the auto-costed margin changed.
7. Open Compliance and mark one high-risk item complete.
8. Open Safety and show unsafe temperature highlighting.
9. Open Reputation and generate a review reply plus profile update plan.

## Technical Details

- Tools: React, Vite, JavaScript, React Router, Recharts, lucide-react.
- Persistence: localStorage through a `dataStore` abstraction.
- Data shape: spreadsheet-style rows for future Google Sheets migration.
- Menu costing: manual costs or supplier-linked recipe rows using exact-unit matches.
- Mock AI: deterministic local functions; no API keys required.
- Future stubs: Google Sheets, Google Business Profile, external AI.

## Key Implementation Decisions

- Keep the MVP offline and judge-accessible.
- Avoid OAuth, scraping, posting, backend services, and enterprise architecture.
- Use local calculations for trustable, explainable recommendations.
- Compute menu profitability from effective ingredient cost.
- Keep supplier tracking lightweight and avoid inventory/order management.

## Technical Challenges

- Making realistic demo data feel operational without building a full restaurant platform.
- Preserving information hiding while still keeping the app simple.
- Handling same-unit supplier comparisons without misleading unit conversion.
- Making supplier price changes update recipe-linked menu margins without a backend.
- Making mock AI useful while staying deterministic and offline.

## Future Integrations

- Google Sheets API for shared restaurant operations sheets.
- Google Business Profile API for official profile and review workflows.
- External AI API for richer planning and replies.
- POS/order systems for imported sales and item performance signals.
