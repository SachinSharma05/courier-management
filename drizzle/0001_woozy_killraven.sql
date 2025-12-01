CREATE TABLE "client_credentials" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"provider_id" integer NOT NULL,
	"env_key" varchar(100) NOT NULL,
	"encrypted_value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"provider_id" integer NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courier_distance_slabs" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"min_km" integer NOT NULL,
	"max_km" integer NOT NULL,
	"price" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courier_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"code" text NOT NULL,
	"base_price" numeric NOT NULL,
	"priority_multiplier" numeric DEFAULT '1' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courier_surcharges" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"load_type" text NOT NULL,
	"price" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courier_weight_slabs" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"min_weight" numeric NOT NULL,
	"max_weight" numeric NOT NULL,
	"price" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(50) NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "providers_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(150) NOT NULL,
	"email" varchar(254) NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'client' NOT NULL,
	"company_name" text,
	"company_address" text,
	"contact_person" text,
	"phone" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
