<?php
// Start session only if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header('Content-Type: application/json');
// Don't use wildcard for origin when dealing with credentials/sessions
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? 'http://localhost'));
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 3600');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

if ($db === null) {
    http_response_code(500);
    echo json_encode(array('message' => 'Database connection failed'));
    exit();
}

// Only handle requests if this file is called directly (not included)
if (basename($_SERVER['PHP_SELF']) === 'auth.php') {
    $method = $_SERVER['REQUEST_METHOD'];
    $action = isset($_GET['action']) ? $_GET['action'] : '';

    try {
        switch ($method) {
        case 'POST':
            if ($action === 'login') {
                handleLogin($db);
            } elseif ($action === 'logout') {
                handleLogout();
            } else {
                http_response_code(400);
                echo json_encode(array('message' => 'Invalid action'));
            }
            break;
            
        case 'GET':
            if ($action === 'check') {
                checkAuthStatus();
            } elseif ($action === 'profile') {
                getUserProfile($db);
            } else {
                http_response_code(400);
                echo json_encode(array('message' => 'Invalid action'));
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(array('message' => 'Method not allowed'));
            break;
    }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array('message' => 'Server error: ' . $e->getMessage()));
    }
}

function handleLogin($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['username']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(array('message' => 'Username dan password diperlukan'));
        return;
    }
    
    $username = trim($input['username']);
    $password = $input['password'];
    
    if (empty($username) || empty($password)) {
        http_response_code(400);
        echo json_encode(array('message' => 'Username dan password tidak boleh kosong'));
        return;
    }
    
    // Get user from database
    $query = "SELECT id, username, password, role, full_name, email, status FROM users WHERE username = ? AND status = 'active'";
    $stmt = $db->prepare($query);
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(array('message' => 'Username atau password salah'));
        return;
    }
    
    // Verify password
    if (!password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(array('message' => 'Username atau password salah'));
        return;
    }
    
    // Create session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['full_name'] = $user['full_name'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['login_time'] = time();
    
    // Update last login (optional)
    $updateQuery = "UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->execute([$user['id']]);
    
    echo json_encode(array(
        'success' => true,
        'message' => 'Login berhasil',
        'user' => array(
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'full_name' => $user['full_name'],
            'email' => $user['email']
        )
    ));
}

function handleLogout() {
    session_destroy();
    echo json_encode(array(
        'success' => true,
        'message' => 'Logout berhasil'
    ));
}

function checkAuthStatus() {
    if (isset($_SESSION['user_id'])) {
        echo json_encode(array(
            'authenticated' => true,
            'user' => array(
                'id' => $_SESSION['user_id'],
                'username' => $_SESSION['username'],
                'role' => $_SESSION['role'],
                'full_name' => $_SESSION['full_name'],
                'email' => $_SESSION['email'],
                'login_time' => $_SESSION['login_time']
            )
        ));
    } else {
        echo json_encode(array(
            'authenticated' => false
        ));
    }
}

function getUserProfile($db) {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(array('message' => 'Unauthorized'));
        return;
    }
    
    $query = "SELECT id, username, role, full_name, email, status, created_at FROM users WHERE id = ?";
    $stmt = $db->prepare($query);
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(array('message' => 'User not found'));
        return;
    }
    
    echo json_encode(array(
        'success' => true,
        'user' => $user
    ));
}

// Function to check if user has permission (can be used in other API files)
function checkPermission($requiredRole = null) {
    if (!isset($_SESSION['user_id'])) {
        return false;
    }
    
    if ($requiredRole && $_SESSION['role'] !== $requiredRole && $_SESSION['role'] !== 'admin') {
        return false;
    }
    
    return true;
}

// Function to check if user has admin role
function isAdmin() {
    return isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
}

// Function to get current user ID
function getCurrentUserId() {
    return isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
}

// Function to get current user role
function getCurrentUserRole() {
    return isset($_SESSION['role']) ? $_SESSION['role'] : null;
}
?>