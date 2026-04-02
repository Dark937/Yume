<?php
/**
 * DB Connection Test Script
 * Run this to verify if the site can connect to Altervista MySQL
 */
header('Content-Type: application/json');
require_once 'db.php';

try {
    $pdo = get_db_connection();
    
    // Check if table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'orders'");
    $tableExists = $stmt->rowCount() > 0;

    echo json_encode([
        'success' => true,
        'message' => 'Database connection successful!',
        'database' => 'my_yume',
        'table_orders_exists' => $tableExists,
        'php_version' => PHP_VERSION,
        'mysql_version' => $pdo->getAttribute(PDO::ATTR_SERVER_VERSION)
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
