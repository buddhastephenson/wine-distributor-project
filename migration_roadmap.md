# Strategic Migration Plan: From "Special Orders" to Full ERP

## Executive Summary
This document outlines the strategic roadmap to evolve the **AOC Special Orders App** from a supplementary catalog tool into a core operating system. The ultimate goal is to deprecate the reliance on Vinosmith by progressively building native capabilities for CRM, Inventory, and Order Processing, rooted in a direct integration with **QuickBooks Online (QBO)**.

The strategy is built on a "Strangler Fig" pattern: we will build new features in the App and "strangle" the dependency on Vinosmith one module at a time, using QBO as the shared source of financial truth.

---

## Phase 1: The Bridge (Immediate Goal - Weekend Sprint)
**Objective**: Connect the App to QBO to push new products.
**Context**: Currently, you must manually enter products in Vinosmith/QBO to put them on POs.
**Goal**: Create a product in the App -> Push to QBO -> Vinosmith reads from QBO.

### Implementation Steps
1.  **QBO Developer Account**: Set up an Intuit Developer account and create an app to get Client ID/Secret.
2.  **OAuth 2.0 Implementation**:
    *   Add `intuit-oauth` and `node-quickbooks` (or similar SDK) to `server.js`.
    *   Create endpoints: `/api/auth/qbo/connect`, `/api/auth/qbo/callback`.
    *   Store `access_token` and `refresh_token` securely (initially in DB for the admin user).
3.  **Product Sync Feature**:
    *   Add a "Sync to QBO" button in the Admin Product Editor.
    *   Backend logic: Map our `Product` schema to QBO `Item` schema.
    *   Handle "Income Account" and "Expense Account" references (required by QBO).

### Technical "Refactor" Prerequisite
To do this cleanly, we should enforce strict Mongoose schemas for Products (which is already underway) to ensure data validity before sending to QBO.

---

## Phase 2: CRM & Inventory Foundation (Months 1-2)
**Objective**: Make the App the "System of Truth" for Customers and Inventory, taking over from Vinosmith.
**Transition**: Vinosmith becomes a "reader" rather than the "writer" of this data.

### Key Features
1.  **Enhanced Customer Model (CRM)**:
    *   Expand `User` model to include Payment Terms, Billing Address, Shipping Address, and Resale License details.
    *   Import all existing QBO customers into the App to seed the database.
2.  **Inventory Tracking**:
    *   Move from "Active Catalog" (boolean) to "Quantity on Hand" (integer).
    *   Implement "Stock Adjustments" (Inventory In/Out logs).
    *   Sync simple Inventory Asset values to QBO.

---

## Phase 3: Order Processing & Purchase Orders (Months 3-6)
**Objective**: Process live transactions in the App. This is the tipping point where day-to-day operations shift.
**Transition**: Staff starts writing POs and Orders here instead of Vinosmith.

### Key Features
1.  **Purchase Orders (PO)**:
    *   Create POs for Suppliers (e.g., Louis Dressner).
    *   **Workflow**: Create PO in App -> products arrive -> "Receive PO" -> updates Inventory Count -> pushes "Bill" to QBO.
2.  **Sales Orders (Invoices)**:
    *   Convert "Special Order Lists" into formal "Invoices".
    *   **Workflow**: Vendor delivers -> "Fulfill Order" -> decrements Inventory -> pushes "Invoice" to QBO.

### QBO Integration Depth
*   **Two-way Sync**: App needs to listen for payments received in QBO to update order status to "Paid".

---

## Phase 4: Analytics & Full Independence (Month 6+)
**Objective**: Replace the reporting and analytics features of Vinosmith.

### Key Features
1.  **Depletion Reports**:
    *   "How many cases of *Biboulette 2022* did we sell last month?"
    *   Visualize trends (Sales by Rep, Sales by Region).
2.  **Commissions**:
    *   Calculate sales rep commissions based on Gross Margin (already calculated in your frontend formulas!).
3.  **Vinosmith Retirement**:
    *   Verify all operational workflows handled.
    *   Cancel subscription.

---

## Recommendation for "The Refactor"
To support this growth, the codebase needs to mature from a "Prototype/script-heavy" architecture to a robust "Application" architecture.

**Suggested Technical Refactor (Pre-QBO):**
1.  **Service Layer**: Separate the business logic from `server.js`.
    *   Create `src/services/QBOService.js` (handles all QBO API calls).
    *   Create `src/services/ProductService.js` (handles pricing formulas and DB saves).
2.  **Environment Config**: Ensure strict separation of Prod/Dev credentials for QBO to avoid messing up your live books during testing.
