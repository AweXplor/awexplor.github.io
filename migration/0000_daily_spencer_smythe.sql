CREATE TABLE `awesome_repo` (
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` integer NOT NULL,
	`readme_digest` text NOT NULL,
	`items` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `github_repo` (
	`id` text PRIMARY KEY NOT NULL,
	`description` text NOT NULL,
	`topics` text,
	`owner` text NOT NULL,
	`stars` integer NOT NULL,
	`stars_detail` text,
	`license` text,
	`forks` integer NOT NULL,
	`primary_language` text NOT NULL,
	`pushed_at` integer NOT NULL,
	`archived` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
