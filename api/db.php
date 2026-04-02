<?php
/**
 * Database Connection for Yume Store
 * Loads credentials from ../config.env
 */

function get_db_connection() {
    $env_path = dirname(__DIR__) . '/config.env';
    
    if (!file_exists($env_path)) {
        die("Error: config.env not found.");
    }

    $env = parse_ini_file($env_path);
    
    $host = $env['DB_HOST'] ?? 'localhost';
    $dbname = $env['DB_NAME'] ?? '';
    $user = $env['DB_USER'] ?? '';
    $pass = $env['DB_PASS'] ?? '';

    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $pdo;
    } catch (PDOException $e) {
        // Log error and return JSON instead of dying with 500
        error_log($e->getMessage());
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false, 
            'error' => 'Database connection failed',
            'debug' => $e->getMessage() // This helps identifying the issue (e.g. Access Denied)
        ]);
        exit;
    }
}
?>

