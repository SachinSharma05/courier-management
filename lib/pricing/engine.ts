import { pinDB } from "@/lib/pinDB";
import { pincodes } from "@/db/pincodeSchema";
import { db } from "@/lib/db/postgres";
import {
  courierWeightSlabs,
  courierServices,
  courierDistanceSlabs,
  courierSurcharges
} from "@/db/schema/pricing";
import { eq, and, gte, lte } from "drizzle-orm";

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

// Rough distance from origin_pincode to dest_pincode based on zone logic
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

export async function calculatePrice({
  client_id,
  service_type,
  load_type,
  weight,
  origin_pincode,
  dest_pincode,
}) {
  // 1) Base price via service
  const [service] = await db
    .select()
    .from(courierServices)
    .where(and(eq(courierServices.client_id, client_id), eq(courierServices.code, service_type)))
    .limit(1);

  const base_price = Number(service?.base_price ?? 30);

  // 2) Weight slab
  const [slab] = await db
    .select()
    .from(courierWeightSlabs)
    .where(and(
      eq(courierWeightSlabs.client_id, client_id),
      lte(courierWeightSlabs.min_weight, weight),
      gte(courierWeightSlabs.max_weight, weight)
    ))
    .limit(1);

  const weight_charge = slab ? Number(slab.price) : weight * 20;

  // 3) Distance slab
  const km = await estimateDistanceKM(origin_pincode, dest_pincode);

  const [dist] = await db
    .select()
    .from(courierDistanceSlabs)
    .where(and(
      eq(courierDistanceSlabs.client_id, client_id),
      lte(courierDistanceSlabs.min_km, km),
      gte(courierDistanceSlabs.max_km, km)
    ))
    .limit(1);

  const distance_charge = dist ? Number(dist.price) : km * 0.5;

  // 4) Load surcharge
  let non_doc_surcharge = 0;
  if (load_type === "NON-DOCUMENT") {
    const [s] = await db
      .select()
      .from(courierSurcharges)
      .where(and(eq(courierSurcharges.client_id, client_id), eq(courierSurcharges.load_type, "NON-DOCUMENT")))
      .limit(1);

    non_doc_surcharge = s ? Number(s.price) : 15;
  }

  const total = base_price + weight_charge + distance_charge + non_doc_surcharge;

  return {
    base_price,
    weight_charge,
    distance_charge,
    non_doc_surcharge,
    km_estimated: km,
    total: Math.round(total),
  };
}
