CREATE TABLE "complaints" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"awb" varchar(50) NOT NULL,
	"message" text NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX idx_invoices_client_id ON invoices (client_id);
CREATE INDEX idx_invoices_month ON invoices (month);
CREATE INDEX idx_invoices_status ON invoices (status);
CREATE INDEX idx_items_invoice_id ON invoice_items (invoice_id);
CREATE INDEX idx_items_awb ON invoice_items (awb);