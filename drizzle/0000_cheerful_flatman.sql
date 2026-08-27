CREATE TABLE "favorites" (
	"user_id" text NOT NULL,
	"film_slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_user_id_film_slug_pk" PRIMARY KEY("user_id","film_slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watch_progress" (
	"user_id" text NOT NULL,
	"film_slug" text NOT NULL,
	"episode" text NOT NULL,
	"server_name" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "watch_progress_user_id_film_slug_pk" PRIMARY KEY("user_id","film_slug")
);
