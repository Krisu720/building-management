CREATE TYPE "public"."inspection_status" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."inspection_type" AS ENUM('gas', 'electrical', 'chimney', 'building_annual', 'building_five_year', 'other');--> statement-breakpoint
CREATE TYPE "public"."issue_status" AS ENUM('new', 'in_progress', 'resolved', 'rejected');--> statement-breakpoint
CREATE TABLE "apartments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid NOT NULL,
	"number" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "apartments_buildingId_number_unique" UNIQUE("building_id","number")
);
--> statement-breakpoint
CREATE TABLE "inspection_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inspection_id" uuid NOT NULL,
	"status" "inspection_status" NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"changed_by" text,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "inspection_type" NOT NULL,
	"building_id" uuid NOT NULL,
	"apartment_id" uuid,
	"scheduled_at" timestamp with time zone NOT NULL,
	"status" "inspection_status" DEFAULT 'scheduled' NOT NULL,
	"technician_id" text,
	"result" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issue_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issue_id" uuid NOT NULL,
	"status" "issue_status" NOT NULL,
	"changed_by" text,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" "issue_status" DEFAULT 'new' NOT NULL,
	"building_id" uuid NOT NULL,
	"apartment_id" uuid,
	"reporter_id" text,
	"technician_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issue_id" uuid,
	"inspection_id" uuid,
	"file_path" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "photos_single_owner" CHECK (num_nonnulls("photos"."issue_id", "photos"."inspection_id") = 1)
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "apartment_id" uuid;--> statement-breakpoint
ALTER TABLE "buildings" ADD COLUMN "admin_id" text;--> statement-breakpoint
ALTER TABLE "apartments" ADD CONSTRAINT "apartments_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_history" ADD CONSTRAINT "inspection_history_inspection_id_inspections_id_fk" FOREIGN KEY ("inspection_id") REFERENCES "public"."inspections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_history" ADD CONSTRAINT "inspection_history_changed_by_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_apartment_id_apartments_id_fk" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_technician_id_user_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_history" ADD CONSTRAINT "issue_history_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_history" ADD CONSTRAINT "issue_history_changed_by_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_apartment_id_apartments_id_fk" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_technician_id_user_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_inspection_id_inspections_id_fk" FOREIGN KEY ("inspection_id") REFERENCES "public"."inspections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inspection_history_inspection_id_index" ON "inspection_history" USING btree ("inspection_id");--> statement-breakpoint
CREATE INDEX "inspections_building_id_index" ON "inspections" USING btree ("building_id");--> statement-breakpoint
CREATE INDEX "inspections_apartment_id_index" ON "inspections" USING btree ("apartment_id");--> statement-breakpoint
CREATE INDEX "inspections_technician_id_index" ON "inspections" USING btree ("technician_id");--> statement-breakpoint
CREATE INDEX "inspections_scheduled_at_index" ON "inspections" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "issue_history_issue_id_index" ON "issue_history" USING btree ("issue_id");--> statement-breakpoint
CREATE INDEX "issues_building_id_index" ON "issues" USING btree ("building_id");--> statement-breakpoint
CREATE INDEX "issues_apartment_id_index" ON "issues" USING btree ("apartment_id");--> statement-breakpoint
CREATE INDEX "issues_reporter_id_index" ON "issues" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "issues_technician_id_index" ON "issues" USING btree ("technician_id");--> statement-breakpoint
CREATE INDEX "issues_status_index" ON "issues" USING btree ("status");--> statement-breakpoint
CREATE INDEX "photos_issue_id_index" ON "photos" USING btree ("issue_id");--> statement-breakpoint
CREATE INDEX "photos_inspection_id_index" ON "photos" USING btree ("inspection_id");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_apartment_id_apartments_id_fk" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_admin_id_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_apartment_id_index" ON "user" USING btree ("apartment_id");--> statement-breakpoint
CREATE INDEX "buildings_admin_id_index" ON "buildings" USING btree ("admin_id");