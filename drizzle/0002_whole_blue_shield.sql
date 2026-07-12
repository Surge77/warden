CREATE TABLE `reminders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`expense_id` integer NOT NULL,
	`kind` text NOT NULL,
	`fire_at` integer NOT NULL,
	`notification_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`expense_id`) REFERENCES `expenses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_reminders_expense_id` ON `reminders` (`expense_id`);--> statement-breakpoint
ALTER TABLE `expenses` ADD `item_name` text;--> statement-breakpoint
ALTER TABLE `expenses` ADD `return_window_days` integer;--> statement-breakpoint
ALTER TABLE `expenses` ADD `warranty_months` integer;