# User Stories — MVP-1

## Personas

| Persona | Role | Goals |
|---------|------|-------|
| **Aki (Admin)** | ADMIN | Manage users, customers, suppliers, oversee books |
| **Ken (Member)** | MEMBER | Record transactions, issue invoices, manage POs |

## Stories

### Customers

**US-CUST-01** — As Ken, I want to create a customer with contact details so I can link sales and invoices to a consistent record.

**Acceptance:** Name required; optional code, email, address, phone, tax ID, payment terms; appears in customer list.

**US-CUST-02** — As Aki, I want to deactivate a customer so they no longer appear in pickers but history is preserved.

### Suppliers

**US-SUPP-01** — As Ken, I want to create a supplier so purchase orders and purchases reference the correct vendor.

**US-SUPP-02** — As Aki, I want to deactivate a supplier without deleting PO history.

### Sales Orders (evolved from Invoices)

**US-SO-01** — As Ken, I want to create a draft sales order with line items for a customer so I can bill before payment.

**Acceptance:** Customer required; default one line row; Add line item button; per-line tax rate.

**US-SO-02** — As Ken, I want to issue a sales order as a numbered PDF (SO-YYYY-NNNN) so I can send it to the customer.

**US-SO-03** — As Ken, I want issued sales orders to appear on the ledger with the customer code (not free-text counterparty).

**US-SO-04** — As Ken, I want to record payment against an issued sales order.

**US-SO-05** — As Ken, I want to void an issued sales order if it was created in error.

### Purchase orders (bill entry)

**US-PO-01** — As Ken, I want to create a draft PO with line items for a supplier to record a supplier bill (e.g. auction invoice with mixed tax rates).

**US-PO-02** — As Ken, I want to post a PO so it appears on the ledger with the supplier code.

**Acceptance:** Raize example — 4 lines (10% and 0% rates) → total ¥2,105,610, 仕入税額 ¥190,620.

**US-PO-03** — As Ken, I want to upload supplier receipts against a PO for evidence.

**US-PO-04** — As Ken, I want to record payment on a posted PO.

**US-PO-05** — As Ken, I want to cancel or void a PO that will not be used.

### Expenses

**US-EXP-01** — As Ken, I want to record an expense with optional supplier and line items for itemized vouchers.

**US-EXP-02** — As Ken, I want to post an expense so it contributes to 仕入税額 on the dashboard and appears on the ledger.

**US-EXP-03** — As Ken, I want to attach receipt images/PDFs to an expense.

### Ledger

**US-LED-01** — As Ken, I want a single ledger view of posted POs, issued sales orders, and posted expenses filtered by year.

**US-LED-02** — As Ken, I want the ledger to show customer/supplier **code** from masters, not a counterparty text field.

**US-LED-03** — As Ken, I want each ledger row to link to the source document detail page.

### Payments

**US-PAY-01** — As Ken, I want to set due date and amount paid on a document so I know what is still outstanding.

**US-PAY-02** — As Ken, I want payment status (unpaid / partial / paid) computed from amount vs amount paid.

### Consumption tax (MVP-2)

**US-JCT-01** — As Aki, I want to configure whether the business is 免税 or 課税 so tax fields appear only when needed.

**US-JCT-02** — As Ken, I want to record tax rate and amount on sales and purchases when 課税 so I can track 売上税額 and 仕入税額.

**US-JCT-03** — As Aki, I want a dashboard summary of output tax, input tax, and estimated net JCT for the selected year (draft).
