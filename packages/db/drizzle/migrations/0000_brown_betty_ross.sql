CREATE TABLE "Attachment" (
	"id" text PRIMARY KEY NOT NULL,
	"transactionId" text NOT NULL,
	"originalName" text NOT NULL,
	"storedName" text NOT NULL,
	"mimeType" text NOT NULL,
	"size" integer NOT NULL,
	"uploadedById" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"date" timestamp NOT NULL,
	"counterparty" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"amount" integer NOT NULL,
	"memo" text,
	"createdById" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"passwordHash" text NOT NULL,
	"role" text DEFAULT 'MEMBER' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_transactionId_Transaction_id_fk" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedById_User_id_fk" FOREIGN KEY ("uploadedById") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_createdById_User_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "Attachment_storedName_key" ON "Attachment" USING btree ("storedName");--> statement-breakpoint
CREATE INDEX "Transaction_date_idx" ON "Transaction" USING btree ("date");--> statement-breakpoint
CREATE INDEX "Transaction_type_date_idx" ON "Transaction" USING btree ("type","date");--> statement-breakpoint
CREATE UNIQUE INDEX "User_email_key" ON "User" USING btree ("email");