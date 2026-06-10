CREATE TABLE "CompanySettings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"jctStatus" text DEFAULT 'EXEMPT' NOT NULL,
	"invoiceRegistrationNumber" text,
	"companyName" text,
	"companyAddress" text,
	"defaultTaxRate" integer DEFAULT 10 NOT NULL,
	"priceBasis" text DEFAULT 'TAX_EXCLUSIVE' NOT NULL,
	"taxRounding" text DEFAULT 'FLOOR' NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "CompanySettings" ("id", "jctStatus") VALUES ('default', 'EXEMPT');
--> statement-breakpoint
ALTER TABLE "Transaction" ADD COLUMN "taxRate" integer;
--> statement-breakpoint
ALTER TABLE "Transaction" ADD COLUMN "taxAmount" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "Transaction" ADD COLUMN "amountExTax" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "Invoice" ADD COLUMN "subtotalExTax" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "Invoice" ADD COLUMN "totalTax" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "InvoiceLine" ADD COLUMN "taxRate" integer DEFAULT 10 NOT NULL;
--> statement-breakpoint
ALTER TABLE "InvoiceLine" ADD COLUMN "taxAmount" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "InvoiceLine" ADD COLUMN "lineTotalExTax" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "PurchaseOrder" ADD COLUMN "subtotalExTax" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "PurchaseOrder" ADD COLUMN "totalTax" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "PurchaseOrderLine" ADD COLUMN "taxRate" integer DEFAULT 10 NOT NULL;
--> statement-breakpoint
ALTER TABLE "PurchaseOrderLine" ADD COLUMN "taxAmount" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "PurchaseOrderLine" ADD COLUMN "lineTotalExTax" integer DEFAULT 0 NOT NULL;
