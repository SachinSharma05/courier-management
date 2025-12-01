import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as pinSchema from "@/db/pincodeSchema";

const sqlite = new Database("data/pincode/pincodes.sqlite");

export const pinDB = drizzle(sqlite, { schema: pinSchema });
