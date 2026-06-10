CREATE TABLE "Customer" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"email" text,
	"address" text,
	"phone" text,
	"taxId" text,
	"paymentTermsDays" integer DEFAULT 30 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Supplier" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"email" text,
	"address" text,
	"phone" text,
	"taxId" text,
	"paymentTermsDays" integer DEFAULT 30 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Invoice" (
	"id" text PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"customerId" text NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"issueDate" timestamp NOT NULL,
	"dueDate" timestamp NOT NULL,
	"notes" text,
	"totalAmount" integer DEFAULT 0 NOT NULL,
	"pdfStoredName" text,
	"transactionId" text,
	"createdById" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "InvoiceLine" (
	"id" text PRIMARY KEY NOT NULL,
	"invoiceId" text NOT NULL,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unitPrice" integer NOT NULL,
	"lineTotal" integer NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PurchaseOrder" (
	"id" text PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"supplierId" text NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"issueDate" timestamp NOT NULL,
	"expectedDate" timestamp,
	"notes" text,
	"totalAmount" integer DEFAULT 0 NOT NULL,
	"createdById" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PurchaseOrderLine" (
	"id" text PRIMARY KEY NOT NULL,
	"purchaseOrderId" text NOT NULL,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unitPrice" integer NOT NULL,
	"qtyReceived" integer DEFAULT 0 NOT NULL,
	"lineTotal" integer NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Transaction" ADD COLUMN "customerId" text;--> statement-breakpoint
ALTER TABLE "Transaction" ADD COLUMN "supplierId" text;--> statement-breakpoint
ALTER TABLE "Transaction" ADD COLUMN "dueDate" timestamp;--> statement-breakpoint
ALTER TABLE "Transaction" ADD COLUMN "paymentStatus" text DEFAULT 'UNPAID' NOT NULL;--> statement-breakpoint
ALTER TABLE "Transaction" ADD COLUMN "amountPaid" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "Transaction" ADD COLUMN "invoiceId" text;--> statement-breakpoint
ALTER TABLE "Transaction" ADD COLUMN "purchaseOrderId" text;--> statement-breakpoint
ALTER TABLE "Attachment" ADD COLUMN "purchaseOrderId" text;--> statement-breakpoint
ALTER TABLE "Attachment" ALTER COLUMN "transactionId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_Customer_id_fk" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_transactionId_Transaction_id_fk" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_createdById_User_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_Invoice_id_fk" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_Supplier_id_fk" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_createdById_User_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_purchaseOrderId_PurchaseOrder_id_fk" FOREIGN KEY ("purchaseOrderId") REFERENCES "public"."PurchaseOrder"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_customerId_Customer_id_fk" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_supplierId_Supplier_id_fk" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_purchaseOrderId_PurchaseOrder_id_fk" FOREIGN KEY ("purchaseOrderId") REFERENCES "public"."PurchaseOrder"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "Customer_name_idx" ON "Customer" USING btree ("name");--> statement-breakpoint
CREATE INDEX "Supplier_name_idx" ON "Supplier" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice" USING btree ("number");--> statement-breakpoint
CREATE INDEX "Invoice_customerId_idx" ON "Invoice" USING btree ("customerId");--> statement-breakpoint
CREATE INDEX "Invoice_issueDate_idx" ON "Invoice" USING btree ("issueDate");--> statement-breakpoint
CREATE INDEX "InvoiceLine_invoiceId_idx" ON "InvoiceLine" USING btree ("invoiceId");--> statement-breakpoint
CREATE UNIQUE INDEX "PurchaseOrder_number_key" ON "PurchaseOrder" USING btree ("number");--> statement-breakpoint
CREATE INDEX "PurchaseOrder_supplierId_idx" ON "PurchaseOrder" USING btree ("supplierId");--> statement-breakpoint
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder" USING btree ("status");--> statement-breakpoint
CREATE INDEX "PurchaseOrderLine_purchaseOrderId_idx" ON "PurchaseOrderLine" USING btree ("purchaseOrderId");--> statement-breakpoint
CREATE INDEX "Transaction_customerId_idx" ON "Transaction" USING btree ("customerId");--> statement-breakpoint
CREATE INDEX "Transaction_supplierId_idx" ON "Transaction" USING btree ("supplierId");
