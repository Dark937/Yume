<?php
/**
 * Get Order Data & Tracking
 * Filters history based on time and triggers arrival email flag
 */

header('Content-Type: application/json');
require_once 'db.php';

// Simple CORS check
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

$token = $_GET['token'] ?? '';

if (!$token) {
    echo json_encode(['success' => false, 'error' => 'No token provided']);
    exit;
}

$pdo = get_db_connection();
$token_hash = hash('sha256', $token);

try {
    // 1. CLEANUP OLD ORDERS (Arrival > 7 days ago)
    $cleanup_sql = "DELETE FROM orders WHERE arrival_date < DATE_SUB(NOW(), INTERVAL 7 DAY)";
    $pdo->exec($cleanup_sql);

    // 2. FETCH ORDER
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE token_hash = ?");
    $stmt->execute([$token_hash]);
    $order = $stmt->fetch();

    if (!$order) {
        echo json_encode(['success' => false, 'error' => 'Order not found']);
        exit;
    }

    $history = json_decode($order['status_history'], true);
    $now = new DateTime();
    $visible_history = [];
    $current_status = 'placed';
    $is_delivered = false;

    foreach ($history as $event) {
        $event_time = new DateTime($event['time']);
        if ($event_time <= $now) {
            $visible_history[] = $event;
            $current_status = $event['status'];
            if ($event['status'] === 'delivered') {
                $is_delivered = true;
            }
        }
    }

    // 3. ARRIVAL EMAIL TRIGGER
    $trigger_arrival_email = false;
    if ($is_delivered && $order['arrival_email_sent'] == 0) {
        $trigger_arrival_email = true;
        // Marking as sent is handled by the frontend reporting back success or here directly
        // Let's mark it as sent now to avoid multiple triggers if the email fails but we tried
        $update_stmt = $pdo->prepare("UPDATE orders SET arrival_email_sent = 1 WHERE id = ?");
        $update_stmt->execute([$order['id']]);
    }

    // 4. PREPARE RESPONSE
    // We don't return the token_hash to the frontend
    $response = [
        'success' => true,
        'order' => [
            'status' => $current_status,
            'customer' => [
                'name' => $order['customer_name'],
                'address' => $order['customer_address'],
                'email' => $order['customer_email']
            ],
            'arrival' => date('l, F j', strtotime($order['arrival_date'])),
            'total' => number_format($order['total'], 2) . '€',
            'items' => json_decode($order['order_items'], true),
            'history' => array_reverse($visible_history), // Newest first for realistic tracking feel
            'trigger_arrival_email' => $trigger_arrival_email
        ]
    ];

    echo json_encode($response);

} catch (PDOException $e) {
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
?>
