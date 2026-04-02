<?php
/**
 * Database Connection for Yume Store
 * Loads credentials from ../config.env
 */

function get_env_data($path) {
    if (!file_exists($path)) return [];
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $data = [];
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $data[trim($name)] = trim($value);
    }
    return $data;
}

function get_db_connection() {
    $env_path = dirname(__DIR__) . '/config.env';
    $env = get_env_data($env_path);
    
    // Fallback for default Altervista values
    $host = $env['DB_HOST'] ?? 'localhost';
    $dbname = $env['DB_NAME'] ?? 'my_yume';
    $user = $env['DB_USER'] ?? 'yume';
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

