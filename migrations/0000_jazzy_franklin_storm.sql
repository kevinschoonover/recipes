CREATE TABLE `recipes_account` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `recipes_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `recipes_kitchen_staple` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`category` text,
	FOREIGN KEY (`userId`) REFERENCES `recipes_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `staple_user_idx` ON `recipes_kitchen_staple` (`userId`);--> statement-breakpoint
CREATE TABLE `recipes_recipe_ingredient` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipeId` integer NOT NULL,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`rawText` text NOT NULL,
	`name` text,
	`quantity` real,
	`unit` text,
	`isStaple` integer DEFAULT false,
	FOREIGN KEY (`recipeId`) REFERENCES `recipes_recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ingredient_recipe_idx` ON `recipes_recipe_ingredient` (`recipeId`);--> statement-breakpoint
CREATE TABLE `recipes_recipe_nutrition` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipeId` integer NOT NULL,
	`calories` real,
	`protein` real,
	`carbohydrates` real,
	`fat` real,
	`saturatedFat` real,
	`fiber` real,
	`sugar` real,
	`sodium` real,
	`cholesterol` real,
	`calcium` real,
	`iron` real,
	`potassium` real,
	`vitaminA` real,
	`vitaminC` real,
	`vitaminD` real,
	`servingSize` text,
	FOREIGN KEY (`recipeId`) REFERENCES `recipes_recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recipes_recipe_nutrition_recipeId_unique` ON `recipes_recipe_nutrition` (`recipeId`);--> statement-breakpoint
CREATE INDEX `nutrition_recipe_idx` ON `recipes_recipe_nutrition` (`recipeId`);--> statement-breakpoint
CREATE TABLE `recipes_recipe_step` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipeId` integer NOT NULL,
	`sectionName` text,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`text` text NOT NULL,
	FOREIGN KEY (`recipeId`) REFERENCES `recipes_recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `step_recipe_idx` ON `recipes_recipe_step` (`recipeId`);--> statement-breakpoint
CREATE TABLE `recipes_recipes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`userId` text NOT NULL,
	`importedFrom` text,
	`document` text,
	`name` text NOT NULL,
	`description` text,
	`imageUrl` text,
	`category` text,
	`servings` text,
	`prepTime` text,
	`cookTime` text,
	`totalTime` text,
	`createdAt` integer DEFAULT (unixepoch()),
	`updatedAt` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`userId`) REFERENCES `recipes_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recipes_recipes_slug_unique` ON `recipes_recipes` (`slug`);--> statement-breakpoint
CREATE INDEX `slug_idx` ON `recipes_recipes` (`slug`);--> statement-breakpoint
CREATE INDEX `recipe_user_idx` ON `recipes_recipes` (`userId`);--> statement-breakpoint
CREATE TABLE `recipes_session` (
	`id` text PRIMARY KEY NOT NULL,
	`expiresAt` integer NOT NULL,
	`token` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `recipes_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recipes_session_token_unique` ON `recipes_session` (`token`);--> statement-breakpoint
CREATE TABLE `recipes_shopping_list_item` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`shoppingListId` integer NOT NULL,
	`recipeIngredientId` integer,
	`recipeId` integer,
	`name` text NOT NULL,
	`quantity` real,
	`unit` text,
	`checked` integer DEFAULT false,
	FOREIGN KEY (`shoppingListId`) REFERENCES `recipes_shopping_list`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipeIngredientId`) REFERENCES `recipes_recipe_ingredient`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recipeId`) REFERENCES `recipes_recipes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `shopping_item_list_idx` ON `recipes_shopping_list_item` (`shoppingListId`);--> statement-breakpoint
CREATE TABLE `recipes_shopping_list` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`userId`) REFERENCES `recipes_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `shopping_list_user_idx` ON `recipes_shopping_list` (`userId`);--> statement-breakpoint
CREATE TABLE `recipes_step_ingredient` (
	`recipeStepId` integer NOT NULL,
	`recipeIngredientId` integer NOT NULL,
	PRIMARY KEY(`recipeStepId`, `recipeIngredientId`),
	FOREIGN KEY (`recipeStepId`) REFERENCES `recipes_recipe_step`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipeIngredientId`) REFERENCES `recipes_recipe_ingredient`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `recipes_user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer NOT NULL,
	`image` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recipes_user_email_unique` ON `recipes_user` (`email`);--> statement-breakpoint
CREATE TABLE `recipes_verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer,
	`updatedAt` integer
);
