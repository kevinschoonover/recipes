ALTER TABLE `recipes_shopping_list_item` ADD `sortOrder` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `recipes_shopping_list_item` ADD `category` text DEFAULT 'Other';