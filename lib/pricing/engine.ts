import { pinDB } from "@/lib/pinDB";
import { pincodes } from "@/db/pincodeSchema";
import { db } from "@/lib/db/postgres";
import {
  courierWeightSlabs,
  courierServices,
  courierDistanceSlabs,
  courierSurcharges
} from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

// Map Indian regions into zones
function getZone(region: string) {
  const north = ["Delhi", "Punjab", "Haryana", "UP", "Uttarakhand", "Himachal", "J&K"];
  const west  = ["Maharashtra", "Gujarat", "Rajasthan"];
  const east  = ["West Bengal", "Odisha", "Jharkhand", "Bihar"];
  const south = ["Karnataka", "Kerala", "Tamil Nadu", "Andhra Pradesh", "Telangana"];
  const central = ["MP", "Chhattisgarh"];
  const northeast = ["Assam", "Meghalaya", "Nagaland", "Manipur", "Tripura"];

  region = region.toLowerCase();

  if (north.some(r => region.includes(r.toLowerCase()))) return "north";
  if (west.some(r => region.includes(r.toLowerCase()))) return "west";
  if (east.some(r => region.includes(r.toLowerCase()))) return "east";
  if (south.some(r => region.includes(r.toLowerCase()))) return "south";
  if (central.some(r => region.includes(r.toLowerCase()))) return "central";
  if (northeast.some(r => region.includes(r.toLowerCase()))) return "northeast";

  return "other";
}

// Rough distance estimation
async function estimateDistanceKM(origin_pin: string, dest_pin: string) {
  const [o] = await pinDB.select().from(pincodes).where(eq(pincodes.pincode, origin_pin)).limit(1);
  const [d] = await pinDB.select().from(pincodes).where(eq(pincodes.pincode, dest_pin)).limit(1);

  if (!o || !d) return 500; // fallback

  const zone1 = getZone(o.state);
  const zone2 = getZone(d.state);

  if (o.state === d.state) return 150;
  if (zone1 === zone2) return 450;

  return 1200;
}

interface PriceCalcParams {
  client_id: string | number;
  service_type: string;
  load_type: string;
  weight: number | string;
  origin_pincode: string;
  dest_pincode: string;
}

export async function calculatePrice({
  client_id,
  service_type,
  load_type,
  weight,
  origin_pincode,
  dest_pincode,
}: PriceCalcParams) {

  // ---- FIX: convert all numeric inputs ----
  const clientIdNum = Number(client_id);
  if (Number.isNaN(clientIdNum)) throw new Error("Invalid client_id");

  const weightNum = Number(weight);
  if (Number.isNaN(weightNum)) throw new Error("Invalid weight");

  // ---- 1) Base price ----
  const [service] = await db
    .select()
    .from(courierServices)
    .where(
      and(
        eq(courierServices.client_id, clientIdNum),
        eq(courierServices.code, service_type)
      )
    )
    .limit(1);

  const base_price = Number(service?.base_price ?? 30);

  // ---- 2) Weight slab ----
  const [slab] = await db
  .select()
  .from(courierWeightSlabs)
  .where(
    sql`(${courierWeightSlabs.client_id} = ${clientIdNum})
      AND (${courierWeightSlabs.min_weight}::numeric <= ${weightNum})
      AND (${courierWeightSlabs.max_weight}::numeric >= ${weightNum})`
  )
  .limit(1);

  const weight_charge = slab ? Number(slab.price) : weightNum * 20;

  // ---- 3) Distance slab ----
  const km = await estimateDistanceKM(origin_pincode, dest_pincode);
  const kmNum = Number(km);

  const [dist] = await db
    .select()
    .from(courierDistanceSlabs)
    .where(
      and(
        eq(courierDistanceSlabs.client_id, clientIdNum),
        lte(courierDistanceSlabs.min_km, kmNum),
        gte(courierDistanceSlabs.max_km, kmNum)
      )
    )
    .limit(1);

  const distance_charge = dist ? Number(dist.price) : kmNum * 0.5;

  // ---- 4) Load surcharge ----
  let non_doc_surcharge = 0;

  if (load_type === "NON-DOCUMENT") {
    const [s] = await db
      .select()
      .from(courierSurcharges)
      .where(
        and(
          eq(courierSurcharges.client_id, clientIdNum),
          eq(courierSurcharges.load_type, "NON-DOCUMENT")
        )
      )
      .limit(1);

    non_doc_surcharge = s ? Number(s.price) : 15;
  }

  const total = base_price + weight_charge + distance_charge + non_doc_surcharge;

  return {
    base_price,
    weight_charge,
    distance_charge,
    non_doc_surcharge,
    km_estimated: kmNum,
    total: Math.round(total),
  };
}
