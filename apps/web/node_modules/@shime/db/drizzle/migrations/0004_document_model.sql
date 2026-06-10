-- Purchase Order: bill model fields
ALTER TABLE "PurchaseOrder" ADD COLUMN "dueDate" timestamp;
--> statement-breakpoint
ALTER TABLE "PurchaseOrder" ADD COLUMN "paymentStatus" text DEFAULT 'UNPAID' NOT NULL;
--> statement-breakpoint
ALTER TABLE "PurchaseOrder" ADD COLUMN "amountPaid" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "PurchaseOrder" ADD COLUMN "postedAt" timestamp;
--> statement-breakpoint
UPDATE "PurchaseOrder" SET "status" = 'POSTED', "postedAt" = "updatedAt"
WHERE "status" IN ('SENT', 'PARTIALLY_RECEIVED', 'CLOSED');
--> statement-breakpoint
ALTER TABLE "PurchaseOrderLine" DROP COLUMN IF EXISTS "qtyReceived";
--> statement-breakpoint
-- Sales Order (Invoice): payment fields
ALTER TABLE "Invoice" ADD COLUMN "paymentStatus" text DEFAULT 'UNPAID' NOT NULL;
--> statement-breakpoint
ALTER TABLE "Invoice" ADD COLUMN "amountPaid" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
-- Expense tables
CREATE TABLE "Expense" (
	"id" text PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"expenseDate" timestamp NOT NULL,
	"supplierId" text,
	"description" text DEFAULT '' NOT NULL,
	"notes" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"subtotalExTax" integer DEFAULT 0 NOT NULL,
	"totalTax" integer DEFAULT 0 NOT NULL,
	"totalAmount" integer DEFAULT 0 NOT NULL,
	"dueDate" timestamp,
	"paymentStatus" text DEFAULT 'UNPAID' NOT NULL,
	"amountPaid" integer DEFAULT 0 NOT NULL,
	"postedAt" timestamp,
	"createdById" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "Expense_number_key" ON "Expense" USING btree ("number");
--> statement-breakpoint
CREATE INDEX "Expense_expenseDate_idx" ON "Expense" USING btree ("expenseDate");
--> statement-breakpoint
CREATE INDEX "Expense_supplierId_idx" ON "Expense" USING btree ("supplierId");
--> statement-breakpoint
CREATE INDEX "Expense_status_idx" ON "Expense" USING btree ("status");
--> statement-breakpoint
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_supplierId_Supplier_id_fk" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_createdById_User_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "ExpenseLine" (
	"id" text PRIMARY KEY NOT NULL,
	"expenseId" text NOT NULL,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unitPrice" integer NOT NULL,
	"lineTotal" integer NOT NULL,
	"taxRate" integer DEFAULT 10 NOT NULL,
	"taxAmount" integer DEFAULT 0 NOT NULL,
	"lineTotalExTax" integer DEFAULT 0 NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ExpenseLine_expenseId_idx" ON "ExpenseLine" USING btree ("expenseId");
--> statement-breakpoint
ALTER TABLE "ExpenseLine" ADD CONSTRAINT "ExpenseLine_expenseId_Expense_id_fk" FOREIGN KEY ("expenseId") REFERENCES "public"."Expense"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "Attachment" ADD COLUMN "expenseId" text;
--> statement-breakpoint
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_expenseId_Expense_id_fk" FOREIGN KEY ("expenseId") REFERENCES "public"."Expense"("id") ON DELETE cascade ON UPDATE no action;
