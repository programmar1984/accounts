import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "User",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("passwordHash").notNull(),
    role: text("role").notNull().default("MEMBER"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("createdAt", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("User_email_key").on(table.email)]
);

export const customers = pgTable(
  "Customer",
  {
    id: text("id").primaryKey(),
    code: text("code"),
    name: text("name").notNull(),
    email: text("email"),
    address: text("address"),
    phone: text("phone"),
    taxId: text("taxId"),
    paymentTermsDays: integer("paymentTermsDays").notNull().default(30),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("createdAt", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("Customer_name_idx").on(table.name)]
);

export const suppliers = pgTable(
  "Supplier",
  {
    id: text("id").primaryKey(),
    code: text("code"),
    name: text("name").notNull(),
    email: text("email"),
    address: text("address"),
    phone: text("phone"),
    taxId: text("taxId"),
    paymentTermsDays: integer("paymentTermsDays").notNull().default(30),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("createdAt", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("Supplier_name_idx").on(table.name)]
);

export const transactions = pgTable(
  "Transaction",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    date: timestamp("date", { mode: "date" }).notNull(),
    counterparty: text("counterparty").notNull(),
    description: text("description").notNull().default(""),
    amount: integer("amount").notNull(),
    memo: text("memo"),
    customerId: text("customerId").references(() => customers.id),
    supplierId: text("supplierId").references(() => suppliers.id),
    dueDate: timestamp("dueDate", { mode: "date" }),
    paymentStatus: text("paymentStatus").notNull().default("UNPAID"),
    amountPaid: integer("amountPaid").notNull().default(0),
    invoiceId: text("invoiceId"),
    purchaseOrderId: text("purchaseOrderId"),
    createdById: text("createdById")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("createdAt", { mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("Transaction_date_idx").on(table.date),
    index("Transaction_type_date_idx").on(table.type, table.date),
    index("Transaction_customerId_idx").on(table.customerId),
    index("Transaction_supplierId_idx").on(table.supplierId),
  ]
);

export const invoices = pgTable(
  "Invoice",
  {
    id: text("id").primaryKey(),
    number: text("number").notNull(),
    customerId: text("customerId")
      .notNull()
      .references(() => customers.id),
    status: text("status").notNull().default("DRAFT"),
    issueDate: timestamp("issueDate", { mode: "date" }).notNull(),
    dueDate: timestamp("dueDate", { mode: "date" }).notNull(),
    notes: text("notes"),
    totalAmount: integer("totalAmount").notNull().default(0),
    pdfStoredName: text("pdfStoredName"),
    transactionId: text("transactionId").references(() => transactions.id),
    createdById: text("createdById")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("createdAt", { mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("Invoice_number_key").on(table.number),
    index("Invoice_customerId_idx").on(table.customerId),
    index("Invoice_issueDate_idx").on(table.issueDate),
  ]
);

export const invoiceLines = pgTable(
  "InvoiceLine",
  {
    id: text("id").primaryKey(),
    invoiceId: text("invoiceId")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: integer("unitPrice").notNull(),
    lineTotal: integer("lineTotal").notNull(),
    sortOrder: integer("sortOrder").notNull().default(0),
  },
  (table) => [index("InvoiceLine_invoiceId_idx").on(table.invoiceId)]
);

export const purchaseOrders = pgTable(
  "PurchaseOrder",
  {
    id: text("id").primaryKey(),
    number: text("number").notNull(),
    supplierId: text("supplierId")
      .notNull()
      .references(() => suppliers.id),
    status: text("status").notNull().default("DRAFT"),
    issueDate: timestamp("issueDate", { mode: "date" }).notNull(),
    expectedDate: timestamp("expectedDate", { mode: "date" }),
    notes: text("notes"),
    totalAmount: integer("totalAmount").notNull().default(0),
    createdById: text("createdById")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("createdAt", { mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("PurchaseOrder_number_key").on(table.number),
    index("PurchaseOrder_supplierId_idx").on(table.supplierId),
    index("PurchaseOrder_status_idx").on(table.status),
  ]
);

export const purchaseOrderLines = pgTable(
  "PurchaseOrderLine",
  {
    id: text("id").primaryKey(),
    purchaseOrderId: text("purchaseOrderId")
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: integer("unitPrice").notNull(),
    qtyReceived: integer("qtyReceived").notNull().default(0),
    lineTotal: integer("lineTotal").notNull(),
    sortOrder: integer("sortOrder").notNull().default(0),
  },
  (table) => [
    index("PurchaseOrderLine_purchaseOrderId_idx").on(table.purchaseOrderId),
  ]
);

export const attachments = pgTable(
  "Attachment",
  {
    id: text("id").primaryKey(),
    transactionId: text("transactionId").references(() => transactions.id, {
      onDelete: "cascade",
    }),
    purchaseOrderId: text("purchaseOrderId").references(
      () => purchaseOrders.id,
      { onDelete: "cascade" }
    ),
    originalName: text("originalName").notNull(),
    storedName: text("storedName").notNull(),
    mimeType: text("mimeType").notNull(),
    size: integer("size").notNull(),
    uploadedById: text("uploadedById")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("createdAt", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("Attachment_storedName_key").on(table.storedName)]
);

export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
  attachments: many(attachments),
  invoices: many(invoices),
  purchaseOrders: many(purchaseOrders),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  transactions: many(transactions),
  invoices: many(invoices),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  transactions: many(transactions),
  purchaseOrders: many(purchaseOrders),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [transactions.createdById],
    references: [users.id],
  }),
  customer: one(customers, {
    fields: [transactions.customerId],
    references: [customers.id],
  }),
  supplier: one(suppliers, {
    fields: [transactions.supplierId],
    references: [suppliers.id],
  }),
  attachments: many(attachments),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  createdBy: one(users, {
    fields: [invoices.createdById],
    references: [users.id],
  }),
  transaction: one(transactions, {
    fields: [invoices.transactionId],
    references: [transactions.id],
  }),
  lines: many(invoiceLines),
}));

export const invoiceLinesRelations = relations(invoiceLines, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceLines.invoiceId],
    references: [invoices.id],
  }),
}));

export const purchaseOrdersRelations = relations(
  purchaseOrders,
  ({ one, many }) => ({
    supplier: one(suppliers, {
      fields: [purchaseOrders.supplierId],
      references: [suppliers.id],
    }),
    createdBy: one(users, {
      fields: [purchaseOrders.createdById],
      references: [users.id],
    }),
    lines: many(purchaseOrderLines),
    attachments: many(attachments),
  })
);

export const purchaseOrderLinesRelations = relations(
  purchaseOrderLines,
  ({ one }) => ({
    purchaseOrder: one(purchaseOrders, {
      fields: [purchaseOrderLines.purchaseOrderId],
      references: [purchaseOrders.id],
    }),
  })
);

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  transaction: one(transactions, {
    fields: [attachments.transactionId],
    references: [transactions.id],
  }),
  purchaseOrder: one(purchaseOrders, {
    fields: [attachments.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  uploadedBy: one(users, {
    fields: [attachments.uploadedById],
    references: [users.id],
  }),
}));
