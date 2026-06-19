ALTER TABLE `user_preferences` ADD `interfaceThemeMode` varchar(20) DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `commandSearchEnabled` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `keyboardShortcutsEnabled` int DEFAULT 1 NOT NULL;