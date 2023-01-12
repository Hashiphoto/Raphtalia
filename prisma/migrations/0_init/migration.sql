-- raphtalia.channels definition
CREATE TABLE `channels` (
    `id` varchar(45) NOT NULL,
    `delete_ms` int DEFAULT '-1',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- raphtalia.guilds definition
CREATE TABLE `guilds` (
    `id` varchar(45) NOT NULL,
    `censorship_enabled` tinyint NOT NULL DEFAULT '0',
    `tax_rate` double NOT NULL DEFAULT '0',
    `role_message_id` varchar(45) DEFAULT NULL,
    `store_message_id` varchar(45) DEFAULT NULL,
    `ban_list_message_id` varchar(45) DEFAULT NULL,
    `message_rate` double NOT NULL DEFAULT '60',
    `message_reset_s` int NOT NULL DEFAULT '3600',
    `reactor_rate` double NOT NULL DEFAULT '5',
    `reactee_rate` double NOT NULL DEFAULT '10',
    `price_hike_coefficient` double NOT NULL DEFAULT '0.1',
    `price_drop_days` int NOT NULL DEFAULT '3',
    `price_drop_rate` double NOT NULL DEFAULT '0.035',
    `output_channel` varchar(45) DEFAULT NULL,
    `debug_channel` varchar(45) DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- raphtalia.items definition
CREATE TABLE `items` (
    `id` int NOT NULL AUTO_INCREMENT,
    `name` varchar(128) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 20 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- raphtalia.roles definition
CREATE TABLE `roles` (
    `id` varchar(45) NOT NULL,
    `member_limit` int NOT NULL DEFAULT '-1',
    `last_promotion_on` datetime DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- raphtalia.banned_words definition
CREATE TABLE `banned_words` (
    `word` varchar(45) NOT NULL,
    `guild_id` varchar(45) NOT NULL,
    PRIMARY KEY (`word`, `guild_id`),
    KEY `fk_banned_words_guilds_id_idx` (`guild_id`),
    CONSTRAINT `fk_banned_words_guilds_id` FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- raphtalia.commands definition
CREATE TABLE `commands` (
    `id` int NOT NULL AUTO_INCREMENT,
    `name` varchar(128) NOT NULL,
    `item_id` int NOT NULL,
    PRIMARY KEY (`id`),
    KEY `fk_items_commands_idx` (`item_id`),
    CONSTRAINT `fk_items_commands` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 39 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- raphtalia.guild_inventory definition
CREATE TABLE `guild_inventory` (
    `guild_id` varchar(45) NOT NULL,
    `item_id` int NOT NULL,
    `price` decimal(20, 2) NOT NULL DEFAULT '0.00',
    `max_uses` int NOT NULL DEFAULT '0',
    `quantity` int NOT NULL DEFAULT '0',
    `max_quantity` int NOT NULL DEFAULT '0',
    `sold_in_cycle` int NOT NULL DEFAULT '0',
    `date_last_sold` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `hidden` tinyint NOT NULL DEFAULT '0',
    `steal_protected` tinyint NOT NULL DEFAULT '0',
    `lifespan_days` int DEFAULT NULL,
    PRIMARY KEY (`guild_id`, `item_id`),
    KEY `fk_items_guild_inventory_idx` (`item_id`),
    CONSTRAINT `fk_guilds_guild_inventory` FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`),
    CONSTRAINT `fk_items_guild_inventory` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- raphtalia.screening_questions definition
CREATE TABLE `screening_questions` (
    `id` int NOT NULL AUTO_INCREMENT,
    `guild_id` varchar(45) NOT NULL,
    `prompt` varchar(256) NOT NULL,
    `answer` varchar(256) NOT NULL,
    `timeout_ms` int NOT NULL DEFAULT '30000',
    `strict` tinyint NOT NULL DEFAULT '0',
    PRIMARY KEY (`id`),
    KEY `fk_onboarding_questions_guilds_idx` (`guild_id`),
    CONSTRAINT `fk_onboarding_questions_guilds` FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 16 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- raphtalia.users definition
CREATE TABLE `users` (
    `id` varchar(45) NOT NULL,
    `guild_id` varchar(45) NOT NULL,
    `infractions` int NOT NULL DEFAULT '0',
    `currency` decimal(20, 2) NOT NULL DEFAULT '0.00',
    `citizenship` tinyint NOT NULL DEFAULT '0',
    `bonus_income` double NOT NULL DEFAULT '0',
    `last_message_date` datetime DEFAULT NULL,
    PRIMARY KEY (`id`, `guild_id`),
    KEY `fk_users_guild_id_idx` (`guild_id`),
    CONSTRAINT `fk_users_guild_id` FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- raphtalia.role_contests definition
CREATE TABLE `role_contests` (
    `id` int NOT NULL AUTO_INCREMENT,
    `role_id` varchar(45) NOT NULL,
    `from_role_id` varchar(45) NOT NULL,
    `initiator_id` varchar(45) NOT NULL,
    `start_date` datetime NOT NULL,
    `message_id` varchar(45) NOT NULL,
    PRIMARY KEY (`id`),
    KEY `fk_role_contests_roles_id_idx` (`role_id`),
    KEY `fk_role_contests_roles_from_id_idx` (`from_role_id`),
    KEY `fk_role_contests_users_id_idx` (`initiator_id`),
    CONSTRAINT `fk_role_contests_roles_from_id` FOREIGN KEY (`from_role_id`) REFERENCES `roles` (`id`),
    CONSTRAINT `fk_role_contests_roles_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
    CONSTRAINT `fk_role_contests_users_id` FOREIGN KEY (`initiator_id`) REFERENCES `users` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 65 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- raphtalia.user_inventory definition
CREATE TABLE `user_inventory` (
    `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` varchar(45) NOT NULL,
    `guild_id` varchar(45) NOT NULL,
    `item_id` int NOT NULL,
    `quantity` int NOT NULL DEFAULT '1',
    `remaining_uses` int DEFAULT NULL,
    `date_purchased` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `fk_items_user_inventory_idx` (`item_id`),
    KEY `fk_user_inventory_users` (`user_id`, `guild_id`),
    CONSTRAINT `fk_user_inventory_items` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_user_inventory_users` FOREIGN KEY (`user_id`, `guild_id`) REFERENCES `users` (`id`, `guild_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 521 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- raphtalia.role_contest_bids definition
CREATE TABLE `role_contest_bids` (
    `contest_id` int NOT NULL,
    `user_id` varchar(45) NOT NULL,
    `bid_amount` decimal(20, 2) DEFAULT NULL,
    PRIMARY KEY (`user_id`, `contest_id`),
    KEY `fk_role_contest_bids_role_contests_idx` (`contest_id`),
    CONSTRAINT `fk_role_contest_bids_role_contests` FOREIGN KEY (`contest_id`) REFERENCES `role_contests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_role_contest_bids_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;