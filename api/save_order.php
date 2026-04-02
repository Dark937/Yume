<?php
/**
 * Save Order to Database
 * Receives order details from frontend
 */

header('Content-Type: application/json');
require_once 'db.php';

// Simple CORS check (Restrict to your domain in production)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

$token = $input['token'] ?? '';
$customer = $input['customer'] ?? null;
$items = $input['items'] ?? [];
$subtotal = $input['subtotal'] ?? 0;
$shipping = $input['shipping'] ?? 0;
$customs = $input['customs'] ?? 0;
$total = $input['total'] ?? 0;
$arrival_date_str = $input['arrival_date'] ?? ''; // e.g., "Friday, April 3"

if (!$token || !$customer || !$arrival_date_str) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

// Convert arrival date string to MySQL format (assuming it's a relative date or fixed format)
// For simplicity, we'll parse the date. If it's "Friday, April 3", we need to handle it.
// The frontend also sends 'arrival' as a string. Let's assume we can parse it or send a timestamp.
// Actually, let's have the frontend send a formal ISO date.

$pdo = get_db_connection();

// Create table if not exists (Safety check)
$sql_create = "CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_address TEXT NOT NULL,
    order_items JSON NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    shipping DECIMAL(10, 2) NOT NULL,
    customs DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    arrival_date DATETIME NOT NULL,
    status_history JSON NOT NULL,
    arrival_email_sent TINYINT(1) DEFAULT 0,
    INDEX (token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
$pdo->exec($sql_create);

// Hash the token
$token_hash = hash('sha256', $token);

// Generate Realistic Status History
$order_time = time();
$arrival_time = strtotime($arrival_date_str);
if (!$arrival_time) {
    $arrival_time = $order_time + (5 * 86400); // Default 5 days if parsing fails
}

$history = [];
$history[] = ['status' => 'placed', 'msg' => 'Order received and confirmed.', 'time' => date('Y-m-d H:i:s', $order_time)];

// Randomized events
$events = [
    ['status' => 'processing', 'msg' => 'Order being packed at Yume Tokyo Hub.', 'delay' => [3600 * 2, 3600 * 12]],
    ['status' => 'shipped', 'msg' => 'Package departed from Tokyo International Port.', 'delay' => [3600 * 12, 3600 * 24]],
    ['status' => 'shipped', 'msg' => 'In transit to destination country.', 'delay' => [3600 * 24, 3600 * 48]],
    ['status' => 'shipped', 'msg' => 'Arrived at local customs facility.', 'delay' => [3600 * 48, 3600 * 72]],
    ['status' => 'shipped', 'msg' => 'Released by customs, handed over to local courier.', 'delay' => [3600 * 72, 3600 * 96]],
    ['status' => 'shipped', 'msg' => 'Out for delivery.', 'delay' => [3600 * 96, 3600 * 110]], // Morning of arrival
    ['status' => 'delivered', 'msg' => 'Package delivered! Enjoy your Yume experience.', 'time' => date('Y-m-d H:i:s', $arrival_time)]
];

$current_sim_time = $order_time;
foreach ($events as $index => $event) {
    if (isset($event['time'])) {
        // Already fixed (placed or final delivered)
        if ($event['status'] === 'delivered') {
            $history[] = $event;
        }
        continue;
    }
    
    $delay = rand($event['delay'][0], $event['delay'][1]);
    $current_sim_time += $delay;
    
    // Ensure it doesn't exceed arrival time (except for the last one)
    if ($current_sim_time >= $arrival_time - 3600) {
        $current_sim_time = $arrival_time - rand(1800, 7200);
    }
    
    $history[] = [
        'status' => $event['status'],
        'msg' => $event['msg'],
        'time' => date('Y-m-d H:i:s', $current_sim_time)
    ];
}

// Sort history by time just in case
usort($history, function($a, $b) {
    return strtotime($a['time']) - strtotime($b['time']);
});

try {
    $stmt = $pdo->prepare("INSERT INTO orders (token_hash, customer_name, customer_email, customer_address, order_items, subtotal, shipping, customs, total, arrival_date, status_history) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    $stmt->execute([
        $token_hash,
        $customer['name'],
        $customer['email'],
        $customer['address'],
        json_encode($items),
        (float)$subtotal,
        (float)$shipping,
        (float)$customs,
        (float)$total,
        date('Y-m-d H:i:s', $arrival_time),
        json_encode($history)
    ]);

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        echo json_encode(['success' => false, 'error' => 'Order already exists']);
    } else {
        error_log($e->getMessage());
        echo json_encode(['success' => false, 'error' => 'Database error']);
    }
}
?>
