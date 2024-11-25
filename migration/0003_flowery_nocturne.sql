PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_github_repo` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
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
	`npm_package` text,
	`npm_package_downloads_last_month` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_github_repo`("id", "name", "description", "topics", "owner", "stars", "stars_detail", "license", "forks", "primary_language", "pushed_at", "archived", "npm_package", "npm_package_downloads_last_month", "created_at", "updated_at") SELECT "id", "name", "description", "topics", "owner", "stars", "stars_detail", "license", "forks", "primary_language", "pushed_at", "archived", "npm_package", "npm_package_downloads_last_month", "created_at", "updated_at" FROM `github_repo`;--> statement-breakpoint
DROP TABLE `github_repo`;--> statement-breakpoint
ALTER TABLE `__new_github_repo` RENAME TO `github_repo`;--> statement-breakpoint
PRAGMA foreign_keys=ON;