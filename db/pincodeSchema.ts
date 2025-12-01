import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const pincodes = sqliteTable("pincodes", {
  id: integer("id").primaryKey(),
  pincode: text("pincode").notNull(),
  office: text("office").notNull(),
  division: text("division").notNull(),
  region: text("region").notNull(),
  district: text("district").notNull(),
  state: text("state").notNull(),
});
