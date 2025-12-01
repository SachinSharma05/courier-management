import { pgTable, serial, text, varchar, timestamp, uuid, date, time, integer, boolean, numeric, json, unique } from "drizzle-orm/pg-core";

// CONSIGNMENTS
export const consignments = pgTable("consignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  awb: varchar("awb", { length: 20 }).notNull().unique(),
  lastStatus: text("last_status"),
  origin: text("origin"),
  destination: text("destination"),
  bookedOn: date("booked_on"),
  lastUpdatedOn: timestamp("last_updated_on"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  providers: json("providers").$type<string[]>().default([]),
  client_id: integer("client_id").notNull(), // FK users.id
});

// TRACKING EVENTS
export const trackingEvents = pgTable("tracking_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  consignmentId: uuid("consignment_id").notNull().references(() => consignments.id, { onDelete: "cascade" }),
  action: text("action"),
  actionDate: date("action_date"),
  actionTime: time("action_time"),
  origin: text("origin"),
  destination: text("destination"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

// TRACKING HISTORY LOG
export const trackingHistory = pgTable("tracking_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  consignmentId: uuid("consignment_id").references(() => consignments.id),
  oldStatus: text("old_status"),
  newStatus: text("new_status"),
  changedAt: timestamp("changed_at").defaultNow(),
});

export const clientCredentials = pgTable(
  "client_credentials",
  {
    id: serial("id").primaryKey(),
    client_id: integer("client_id").notNull(),
    provider_id: integer("provider_id").notNull(),
    env_key: varchar("env_key", { length: 100 }).notNull(),
    encrypted_value: text("encrypted_value").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniq: unique("unique_credential_entry")
      .on(table.client_id, table.provider_id, table.env_key),
  })
);

export const clientProviders = pgTable("client_providers", {
  id: serial("id").primaryKey(),
  client_id: integer("client_id").notNull(),
  provider_id: integer("provider_id").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// weight slabs
export const courierWeightSlabs = pgTable("courier_weight_slabs", {
  id: serial("id").primaryKey(),
  client_id: integer("client_id").notNull(), // 0 = global default
  min_weight: numeric("min_weight").notNull(),
  max_weight: numeric("max_weight").notNull(),
  price: numeric("price").notNull(),
});

// service types (STANDARD / PRIORITY etc.)
export const courierServices = pgTable("courier_services", {
  id: serial("id").primaryKey(),
  client_id: integer("client_id").notNull(), // 0 = global default
  code: text("code").notNull(), // STANDARD, PRIORITY
  base_price: numeric("base_price").notNull(),
  priority_multiplier: numeric("priority_multiplier").notNull().default("1"),
});

// distance slabs in KM
export const courierDistanceSlabs = pgTable("courier_distance_slabs", {
  id: serial("id").primaryKey(),
  client_id: integer("client_id").notNull(),
  min_km: integer("min_km").notNull(),
  max_km: integer("max_km").notNull(),
  price: numeric("price").notNull(),
});

// surcharges
export const courierSurcharges = pgTable("courier_surcharges", {
  id: serial("id").primaryKey(),
  client_id: integer("client_id").notNull(),
  load_type: text("load_type").notNull(), // NON-DOCUMENT
  price: numeric("price").notNull(),
});

export const providers = pgTable("providers", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 50 }).notNull().unique(), // "dtdc", "delhivery"
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 150 }).notNull().unique(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  password_hash: text("password_hash").notNull(),
  role: text("role").notNull().default("client"), // client | super_admin
  company_name: text("company_name"),
  company_address: text("company_address"),
  contact_person: text("contact_person"),
  phone: text("phone"),
  providers: json("providers").$type<string[]>().default([]),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
});