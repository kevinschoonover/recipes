ALTER TABLE `recipes_recipes` RENAME COLUMN `id` TO `slug`;--> statement-breakpoint
ALTER TABLE `recipes_recipes` DROP COLUMN `expires`;