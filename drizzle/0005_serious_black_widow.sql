ALTER TABLE "tracking_events" DROP CONSTRAINT "tracking_events_consignment_id_consignments_id_fk";
--> statement-breakpoint
ALTER TABLE "tracking_events" ALTER COLUMN "consignment_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_consignment_id_consignments_id_fk" FOREIGN KEY ("consignment_id") REFERENCES "public"."consignments"("id") ON DELETE cascade ON UPDATE no action;