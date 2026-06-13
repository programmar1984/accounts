CREATE TABLE "ServiceOrder" (
	"id" text PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"supplierId" text NOT NULL,
	"serviceCategory" text NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"issueDate" timestamp NOT NULL,
	"dueDate" timestamp,
	"notes" text,
	"subtotalExTax" integer DEFAULT 0 NOT NULL,
	"totalTax" integer DEFAULT 0 NOT NULL,
	"totalAmount" integer DEFAULT 0 NOT NULL,
	"paymentStatus" text DEFAULT 'UNPAID' NOT NULL,
	"amountPaid" integer DEFAULT 0 NOT NULL,
	"postedAt" timestamp,
	"createdById" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ServiceOrder_number_key" ON "ServiceOrder" USING btree ("number");
--> statement-breakpoint
CREATE INDEX "ServiceOrder_supplierId_idx" ON "ServiceOrder" USING btree ("supplierId");
--> statement-breakpoint
CREATE INDEX "ServiceOrder_status_idx" ON "ServiceOrder" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "ServiceOrder_issueDate_idx" ON "ServiceOrder" USING btree ("issueDate");
--> statement-breakpoint
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_supplierId_Supplier_id_fk" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_createdById_User_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "ServiceOrderLine" (
	"id" text PRIMARY KEY NOT NULL,
	"serviceOrderId" text NOT NULL,
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
CREATE INDEX "ServiceOrderLine_serviceOrderId_idx" ON "ServiceOrderLine" USING btree ("serviceOrderId");
--> statement-breakpoint
ALTER TABLE "ServiceOrderLine" ADD CONSTRAINT "ServiceOrderLine_serviceOrderId_ServiceOrder_id_fk" FOREIGN KEY ("serviceOrderId") REFERENCES "public"."ServiceOrder"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "Attachment" ADD COLUMN "serviceOrderId" text;
--> statement-breakpoint
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_serviceOrderId_ServiceOrder_id_fk" FOREIGN KEY ("serviceOrderId") REFERENCES "public"."ServiceOrder"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
DO $$
DECLARE
  po_rec RECORD;
  new_id text;
  new_num text;
  cat text;
  line_text text;
  migration_note text;
BEGIN
  FOR po_rec IN
    SELECT * FROM "PurchaseOrder"
    WHERE "number" IN (
      'PO-2026-0015', 'PO-2026-0010', 'PO-2026-0009', 'PO-2026-0008',
      'PO-2026-0007', 'PO-2026-0004', 'PO-2026-0002', 'PO-2025-0002'
    )
  LOOP
    new_num := replace(po_rec."number", 'PO-', 'SVO-');
    migration_note := 'Migrated from ' || po_rec."number";

    IF EXISTS (SELECT 1 FROM "ServiceOrder" WHERE "number" = new_num) THEN
      CONTINUE;
    END IF;
    IF EXISTS (
      SELECT 1 FROM "ServiceOrder"
      WHERE "notes" IS NOT NULL AND "notes" LIKE '%' || migration_note || '%'
    ) THEN
      CONTINUE;
    END IF;

    SELECT coalesce(string_agg("description", ' '), '')
    INTO line_text
    FROM "PurchaseOrderLine"
    WHERE "purchaseOrderId" = po_rec."id";

    cat := CASE
      WHEN lower(coalesce(po_rec."notes", '') || ' ' || line_text) ~ '(transport|陸送|配送|トラック|truck|haul)' THEN 'TRANSPORT'
      WHEN lower(coalesce(po_rec."notes", '') || ' ' || line_text) ~ '(inspect|検査|pre-ship|preship)' THEN 'INSPECTION'
      WHEN lower(coalesce(po_rec."notes", '') || ' ' || line_text) ~ '(ship|船積|ocean|freight|海上|sea)' THEN 'SHIPPING'
      WHEN lower(coalesce(po_rec."notes", '') || ' ' || line_text) ~ '(van|バンニング|container|コンテナ)' THEN 'VANNING'
      ELSE 'OTHER'
    END;

    new_id := 'svo' || substr(md5(random()::text || po_rec."id" || clock_timestamp()::text), 1, 21);

    INSERT INTO "ServiceOrder" (
      "id", "number", "supplierId", "serviceCategory", "status",
      "issueDate", "dueDate", "notes",
      "subtotalExTax", "totalTax", "totalAmount",
      "paymentStatus", "amountPaid", "postedAt",
      "createdById", "createdAt", "updatedAt"
    ) VALUES (
      new_id,
      new_num,
      po_rec."supplierId",
      cat,
      po_rec."status",
      po_rec."issueDate",
      po_rec."dueDate",
      CASE
        WHEN po_rec."notes" IS NULL OR po_rec."notes" = '' THEN migration_note
        WHEN po_rec."notes" LIKE '%' || migration_note || '%' THEN po_rec."notes"
        ELSE po_rec."notes" || E'\n' || migration_note
      END,
      po_rec."subtotalExTax",
      po_rec."totalTax",
      po_rec."totalAmount",
      po_rec."paymentStatus",
      po_rec."amountPaid",
      po_rec."postedAt",
      po_rec."createdById",
      po_rec."createdAt",
      po_rec."updatedAt"
    );

    INSERT INTO "ServiceOrderLine" (
      "id", "serviceOrderId", "description", "quantity", "unitPrice",
      "lineTotal", "taxRate", "taxAmount", "lineTotalExTax", "sortOrder"
    )
    SELECT
      'svl' || substr(md5(random()::text || pol."id" || clock_timestamp()::text), 1, 21),
      new_id,
      pol."description",
      pol."quantity",
      pol."unitPrice",
      pol."lineTotal",
      pol."taxRate",
      pol."taxAmount",
      pol."lineTotalExTax",
      pol."sortOrder"
    FROM "PurchaseOrderLine" pol
    WHERE pol."purchaseOrderId" = po_rec."id";

    UPDATE "Attachment"
    SET "serviceOrderId" = new_id, "purchaseOrderId" = NULL
    WHERE "purchaseOrderId" = po_rec."id";

    DELETE FROM "PurchaseOrderLine" WHERE "purchaseOrderId" = po_rec."id";
    DELETE FROM "PurchaseOrder" WHERE "id" = po_rec."id";
  END LOOP;
END $$;
