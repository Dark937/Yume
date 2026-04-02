<?php
/**
 * Config Bridge for EmailJS
 * Returns only non-sensitive EmailJS keys to the frontend
 * Bypasses .htaccess blocks on config.env
 */

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

function get_env_data($path) {
    if (!file_exists($path)) return [];
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $data = [];
    foreach ($lines as $line) {
        $line = trim($line);
        if (!$line || strpos($line, '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($name, $value) = explode('=', $line, 2);
        $data[trim($name)] = trim($value);
    }
    return $data;
}

$env_path = dirname(__DIR__) . '/config.env';
$env = get_env_data($env_path);

if (empty($env)) {
    echo json_encode(['success' => false, 'error' => 'Config file empty or not found']);
    exit;
}

// ONLY output public EmailJS keys. NEVER output DB passwords.
$config = [
    'EMAIL_SERVICE_ID' => $env['EMAIL_SERVICE_ID'] ?? null,
    'EMAIL_TEMPLATE_ID' => $env['EMAIL_TEMPLATE_ID'] ?? null,
    'EMAIL_ARRIVAL_TEMPLATE_ID' => $env['EMAIL_ARRIVAL_TEMPLATE_ID'] ?? null,
    'EMAIL_PUBLIC_KEY' => $env['EMAIL_PUBLIC_KEY'] ?? null
];

echo json_encode(['success' => true, 'config' => $config]);
?>
