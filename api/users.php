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
require_once 'auth.php';

$database = new Database();
$db = $database->getConnection();

if ($db === null) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Database connection failed'));
    exit();
}

// Handle method override and multipart data parsing
$method = $_SERVER['REQUEST_METHOD'];
$parsed_data = array();

// Parse multipart form data manually if needed
if (($method === 'PUT' || $method === 'PATCH') && empty($_POST) && 
    isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') !== false) {
    
    $raw_input = file_get_contents('php://input');
    $parsed_data = parseMultipartFormData($raw_input, $_SERVER['CONTENT_TYPE']);
    
    if (!empty($parsed_data)) {
        if (isset($parsed_data['_method'])) {
            $method = strtoupper($parsed_data['_method']);
            unset($parsed_data['_method']);
        }
        $_POST = $parsed_data;
    }
}

// Check for _method parameter (Laravel style)
if (isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
    unset($_POST['_method']);
}

$response = array('success' => false, 'message' => '', 'data' => null);

try {
    // Check authentication and admin permission for all requests
    if (!checkPermission()) {
        http_response_code(401);
        echo json_encode(array('success' => false, 'message' => 'Authentication required'));
        exit();
    }
    
    if (!isAdmin()) {
        http_response_code(403);
        echo json_encode(array('success' => false, 'message' => 'Admin permission required'));
        exit();
    }

    switch($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                // Get single user
                $query = "SELECT id, username, role, full_name, email, status, created_at, updated_at FROM users WHERE id = :id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':id', $_GET['id']);
                $stmt->execute();
                
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($user) {
                    $response['success'] = true;
                    $response['data'] = $user;
                } else {
                    $response['message'] = 'User not found';
                }
            } else {
                // Get all users
                $query = "SELECT id, username, role, full_name, email, status, created_at, updated_at FROM users ORDER BY created_at DESC";
                $stmt = $db->prepare($query);
                $stmt->execute();
                
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $response['success'] = true;
                $response['data'] = $users;
            }
            break;
            
        case 'POST':
            // Create new user
            $username = $_POST['username'] ?? null;
            $password = $_POST['password'] ?? null;
            $role = $_POST['role'] ?? 'teknisi';
            $full_name = $_POST['full_name'] ?? null;
            $email = $_POST['email'] ?? null;
            $status = $_POST['status'] ?? 'active';
            
            // Validation
            if (!$username || !$password) {
                $response['message'] = 'Username and password required';
                break;
            }
            
            // Check if username already exists
            $checkQuery = "SELECT COUNT(*) FROM users WHERE username = :username";
            $checkStmt = $db->prepare($checkQuery);
            $checkStmt->bindParam(':username', $username);
            $checkStmt->execute();
            
            if ($checkStmt->fetchColumn() > 0) {
                $response['message'] = 'Username already exists';
                break;
            }
            
            // Hash password
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            
            $query = "INSERT INTO users (username, password, role, full_name, email, status) 
                     VALUES (:username, :password, :role, :full_name, :email, :status)";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':username', $username);
            $stmt->bindParam(':password', $hashedPassword);
            $stmt->bindParam(':role', $role);
            $stmt->bindParam(':full_name', $full_name);
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':status', $status);
            
            if ($stmt->execute()) {
                $userId = $db->lastInsertId();
                
                // Get created user data
                $getQuery = "SELECT id, username, role, full_name, email, status, created_at FROM users WHERE id = :id";
                $getStmt = $db->prepare($getQuery);
                $getStmt->bindParam(':id', $userId);
                $getStmt->execute();
                
                $response['success'] = true;
                $response['message'] = 'User created successfully';
                $response['data'] = $getStmt->fetch(PDO::FETCH_ASSOC);
            } else {
                $response['message'] = 'Failed to create user';
            }
            break;
            
        case 'PUT':
            // Update user
            $put_data = $_POST;
            $id = $put_data['id'] ?? null;
            
            if (!$id) {
                $response['message'] = 'ID required for update';
                break;
            }
            
            // Don't allow updating own account to prevent lockout
            if ($id == getCurrentUserId()) {
                $response['message'] = 'Cannot modify your own account';
                break;
            }
            
            // Build dynamic update query
            $update_fields = array();
            $params = array(':id' => $id);
            
            $allowed_fields = ['username', 'role', 'full_name', 'email', 'status'];
            
            foreach ($allowed_fields as $field) {
                if (isset($put_data[$field])) {
                    $update_fields[] = "$field = :$field";
                    $params[":$field"] = $put_data[$field];
                }
            }
            
            // Handle password update separately
            if (isset($put_data['password']) && !empty($put_data['password'])) {
                $update_fields[] = "password = :password";
                $params[":password"] = password_hash($put_data['password'], PASSWORD_DEFAULT);
            }
            
            if (empty($update_fields)) {
                $response['message'] = 'No fields to update';
                break;
            }
            
            // Check for username uniqueness if updating username
            if (isset($put_data['username'])) {
                $checkQuery = "SELECT COUNT(*) FROM users WHERE username = :username AND id != :id";
                $checkStmt = $db->prepare($checkQuery);
                $checkStmt->bindParam(':username', $put_data['username']);
                $checkStmt->bindParam(':id', $id);
                $checkStmt->execute();
                
                if ($checkStmt->fetchColumn() > 0) {
                    $response['message'] = 'Username already exists';
                    break;
                }
            }
            
            $query = "UPDATE users SET " . implode(', ', $update_fields) . " WHERE id = :id";
            $stmt = $db->prepare($query);
            
            if ($stmt->execute($params)) {
                // Get updated user data
                $getQuery = "SELECT id, username, role, full_name, email, status, created_at, updated_at FROM users WHERE id = :id";
                $getStmt = $db->prepare($getQuery);
                $getStmt->bindParam(':id', $id);
                $getStmt->execute();
                
                $response['success'] = true;
                $response['message'] = 'User updated successfully';
                $response['data'] = $getStmt->fetch(PDO::FETCH_ASSOC);
            } else {
                $response['message'] = 'Failed to update user';
            }
            break;
            
        case 'DELETE':
            $input = file_get_contents("php://input");
            $delete_data = array();
            
            // Try to parse JSON first, then form data
            $json_data = json_decode($input, true);
            if ($json_data) {
                $delete_data = $json_data;
            } else {
                parse_str($input, $delete_data);
            }
            
            // Also check for regular POST data
            if (empty($delete_data)) {
                $delete_data = $_POST;
            }
            
            $id = $delete_data['id'] ?? null;
            
            if (!$id) {
                $response['message'] = 'ID required for deletion';
                break;
            }
            
            // Don't allow deleting own account
            if ($id == getCurrentUserId()) {
                $response['message'] = 'Cannot delete your own account';
                break;
            }
            
            // Don't allow deleting if it's the last admin
            $adminCountQuery = "SELECT COUNT(*) FROM users WHERE role = 'admin' AND status = 'active'";
            $adminCountStmt = $db->prepare($adminCountQuery);
            $adminCountStmt->execute();
            $adminCount = $adminCountStmt->fetchColumn();
            
            if ($adminCount <= 1) {
                $userRoleQuery = "SELECT role FROM users WHERE id = :id";
                $userRoleStmt = $db->prepare($userRoleQuery);
                $userRoleStmt->bindParam(':id', $id);
                $userRoleStmt->execute();
                $userRole = $userRoleStmt->fetchColumn();
                
                if ($userRole === 'admin') {
                    $response['message'] = 'Cannot delete the last admin user';
                    break;
                }
            }
            
            $query = "DELETE FROM users WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $id);
            
            if ($stmt->execute()) {
                $response['success'] = true;
                $response['message'] = 'User deleted successfully';
            } else {
                $response['message'] = 'Failed to delete user';
            }
            break;
            
        default:
            http_response_code(405);
            $response['message'] = 'Method not allowed';
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    $response['message'] = 'Server error: ' . $e->getMessage();
}

echo json_encode($response);

// Function to manually parse multipart form data (copied from items.php for consistency)
function parseMultipartFormData($input, $contentType) {
    $data = array();
    
    if (preg_match('/boundary=(.+)$/', $contentType, $matches)) {
        $boundary = $matches[1];
        $parts = array_slice(explode('--' . $boundary, $input), 1);
        
        foreach ($parts as $part) {
            if (trim($part) == '--' || empty(trim($part))) continue;
            
            $sections = explode("\r\n\r\n", $part, 2);
            if (count($sections) != 2) continue;
            
            $headers = $sections[0];
            $body = rtrim($sections[1], "\r\n");
            
            if (preg_match('/name="([^"]*)"/', $headers, $matches)) {
                $fieldName = $matches[1];
                $data[$fieldName] = $body;
            }
        }
    }
    
    return $data;
}
?>