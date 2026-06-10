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
  ]
);

export const attachments = pgTable(
  "Attachment",
  {
    id: text("id").primaryKey(),
    transactionId: text("transactionId")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
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
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [transactions.createdById],
    references: [users.id],
  }),
  attachments: many(attachments),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  transaction: one(transactions, {
    fields: [attachments.transactionId],
    references: [transactions.id],
  }),
  uploadedBy: one(users, {
    fields: [attachments.uploadedById],
    references: [users.id],
  }),
}));
