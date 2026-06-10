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

### Invoices

**US-INV-01** — As Ken, I want to create a draft invoice with line items for a customer so I can bill before payment.

**US-INV-02** — As Ken, I want to issue an invoice as a numbered PDF so I can send it to the customer.

**US-INV-03** — As Ken, I want issuing an invoice to optionally create a SALE transaction with due date so the ledger reflects accounts receivable.

**US-INV-04** — As Ken, I want to void an issued invoice if it was created in error.

### Purchase orders

**US-PO-01** — As Ken, I want to create a draft PO with line items for a supplier.

**US-PO-02** — As Ken, I want to send a PO (status SENT) when I commit to the order.

**US-PO-03** — As Ken, I want to record partial or full receipt against PO lines so inventory/cost is tracked incrementally.

**US-PO-04** — As Ken, I want receiving goods to create a PURCHASE transaction for the received value.

**US-PO-05** — As Ken, I want to upload supplier receipts against a PO for evidence matching.

**US-PO-06** — As Ken, I want to cancel a PO that will not be fulfilled.

### Payments

**US-PAY-01** — As Ken, I want to set due date and amount paid on a transaction so I know what is still outstanding.

**US-PAY-02** — As Ken, I want payment status (unpaid / partial / paid) computed from amount vs amount paid.

### Ledger (MVP-0 retained)

**US-TX-01** — As Ken, I want to upload receipt images/PDFs to a transaction as proof (not invoice issuance).

**US-TX-02** — As Ken, I want to pick a customer or supplier on a transaction instead of typing counterparty when masters exist.
