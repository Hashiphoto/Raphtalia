-- Remove the quantity from the inventory view
CREATE
OR REPLACE ALGORITHM = UNDEFINED VIEW `vw_user_inv_complete` AS
SELECT
  `ui`.`id` AS `id`,
  `ui`.`user_id` AS `user_id`,
  `ui`.`guild_id` AS `guild_id`,
  `ui`.`item_id` AS `item_id`,
  `ui`.`remaining_uses` AS `remaining_uses`,
  `ui`.`date_purchased` AS `date_purchased`,
  `gi`.`price` AS `price`,
  `gi`.`max_uses` AS `max_uses`,
  `gi`.`quantity` AS `quantity`,
  `gi`.`max_quantity` AS `max_quantity`,
  `gi`.`sold_in_cycle` AS `sold_in_cycle`,
  `gi`.`date_last_sold` AS `date_last_sold`,
  `gi`.`hidden` AS `hidden`,
  `gi`.`steal_protected` AS `steal_protected`,
  `gi`.`lifespan_days` AS `lifespan_days`,
  `i`.`name` AS `name`
FROM
  (
    (
      `user_inventory` `ui`
      JOIN `items` `i` ON ((`ui`.`item_id` = `i`.`id`))
    )
    JOIN `guild_inventory` `gi` ON ((`gi`.`item_id` = `i`.`id`))
  );

-- Remove quanitty 
ALTER TABLE
  user_inventory DROP COLUMN quantity;

-- Create fighter table
CREATE TABLE fighters (
  id INT UNSIGNED AUTO_INCREMENT NOT NULL,
  user_id varchar(45) NOT NULL,
  guild_id varchar(45) NOT NULL,
  weapon_1 LONGTEXT NULL,
  weapon_2 LONGTEXT NULL,
  current_health INTEGER DEFAULT 0 NOT NULL,
  max_health INTEGER DEFAULT 0 NOT NULL,
  CONSTRAINT fighters_PK PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Add FK
ALTER TABLE
  fighters
ADD
  CONSTRAINT fighters_FK FOREIGN KEY (user_id, guild_id) REFERENCES users(id, guild_id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Create view
CREATE
OR REPLACE VIEW vw_fighters AS
SELECT
  *
FROM
  fighters;