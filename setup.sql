-- Yume Store Database Setup
-- Run this in PhpMyAdmin for the 'my_yume' database on Altervista.

-- 1. Create Orders Table
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `token_raw` VARCHAR(20) NOT NULL, -- The YME-XXXX-XXXX-XXXX token
  `token_hash` VARCHAR(64) NOT NULL, -- SHA-256 hash for lookup
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_email` VARCHAR(255) NOT NULL,
  `customer_address` TEXT NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `shipping` DECIMAL(10,2) NOT NULL,
  `customs` DECIMAL(10,2) DEFAULT 0.00,
  `total` DECIMAL(10,2) NOT NULL,
  `order_items` JSON NOT NULL, -- Stores array of items
  `arrival_date` DATETIME NOT NULL,
  `status` ENUM('placed', 'processing', 'shipped', 'delivered') DEFAULT 'placed',
  `status_history` JSON NOT NULL, -- Stores history events
  `arrival_email_sent` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Optional: Insert Test Order
-- Token: YME-HOW6-DQIZ-DN58
-- Hash (SHA-256 for 'YME-HOW6-DQIZ-DN58'): 2b070406d4e5f49e0c5ef9440653d9e8d643ed2f (Note: calculate actual hash in PHP)
-- This is just a placeholder. The app will insert real orders via api/save_order.php.
