<?php
/**
 * Config Bridge for EmailJS
 * Returns only non-sensitive EmailJS keys to the frontend
 * Bypasses .htaccess blocks on config.env
 */

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

$env_path = dirname(__DIR__) . '/config.env';

if (!file_exists($env_path)) {
    echo json_encode(['success' => false, 'error' => 'Config file not found']);
    exit;
}

$env = parse_ini_file($env_path);

// ONLY output public EmailJS keys. NEVER output DB passwords.
$config = [
    'EMAIL_SERVICE_ID' => $env['EMAIL_SERVICE_ID'] ?? null,
    'EMAIL_TEMPLATE_ID' => $env['EMAIL_TEMPLATE_ID'] ?? null,
    'EMAIL_ARRIVAL_TEMPLATE_ID' => $env['EMAIL_ARRIVAL_TEMPLATE_ID'] ?? null,
    'EMAIL_PUBLIC_KEY' => $env['EMAIL_PUBLIC_KEY'] ?? null
];

echo json_encode(['success' => true, 'config' => $config]);
?>
