CREATE TABLE "system_settings" (
	"id" varchar(50) PRIMARY KEY DEFAULT 'default' NOT NULL,
	"app_name" varchar(100) DEFAULT 'TaskFlow' NOT NULL,
	"theme" varchar(50) DEFAULT 'Light' NOT NULL,
	"timezone" varchar(100) DEFAULT '(GMT+05:30) India Standard Time' NOT NULL,
	"date_format" varchar(100) DEFAULT 'DD MMM, YYYY (e.g. 28 Oct, 2026)' NOT NULL,
	"two_factor" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
