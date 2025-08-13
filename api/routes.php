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

// Function to parse multipart/form-data for PUT requests
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

// Handle method override and multipart data parsing
$method = $_SERVER['REQUEST_METHOD'];
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

// Check for X-HTTP-Method-Override header
if (isset($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
    $method = $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'];
}

// Check for _method parameter (Laravel style)
if (isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
    unset($_POST['_method']); // Clean it up
}

$response = array('success' => false, 'message' => '', 'data' => null);

try {
    // Check authentication for all requests
    if (!checkPermission()) {
        http_response_code(401);
        echo json_encode(array('success' => false, 'message' => 'Authentication required'));
        exit();
    }

    switch($method) {
        case 'GET':
            // GET requests allowed for all authenticated users
            if (isset($_GET['id'])) {
                // Get single route
                $query = "SELECT r.*, 
                                fi.name as from_item_name, fi.latitude as from_lat, fi.longitude as from_lng,
                                ti.name as to_item_name, ti.latitude as to_lat, ti.longitude as to_lng
                         FROM cable_routes r
                         LEFT JOIN ftth_items fi ON r.from_item_id = fi.id
                         LEFT JOIN ftth_items ti ON r.to_item_id = ti.id
                         WHERE r.id = :id";
                
                $stmt = $db->prepare($query);
                $stmt->bindParam(':id', $_GET['id']);
                $stmt->execute();
                
                $route = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($route) {
                    $response['success'] = true;
                    $response['data'] = $route;
                } else {
                    $response['message'] = 'Route not found';
                }
            } else {
                // Get all routes
                $query = "SELECT r.*, 
                                fi.name as from_item_name, fi.latitude as from_lat, fi.longitude as from_lng,
                                ti.name as to_item_name, ti.latitude as to_lat, ti.longitude as to_lng
                         FROM cable_routes r
                         LEFT JOIN ftth_items fi ON r.from_item_id = fi.id
                         LEFT JOIN ftth_items ti ON r.to_item_id = ti.id
                         ORDER BY r.created_at DESC";
                
                $stmt = $db->prepare($query);
                $stmt->execute();
                
                $routes = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $response['success'] = true;
                $response['data'] = $routes;
            }
            break;
            
        case 'POST':
            // Check admin permission for create operations
            if (!isAdmin()) {
                http_response_code(403);
                echo json_encode(array('success' => false, 'message' => 'Admin permission required for create operations'));
                exit();
            }
            
            // Create new route
            $from_item_id = $_POST['from_item_id'] ?? null;
            $to_item_id = $_POST['to_item_id'] ?? null;
            $route_coordinates = $_POST['route_coordinates'] ?? null;
            $distance = $_POST['distance'] ?? null;
            $cable_type = $_POST['cable_type'] ?? 'Fiber Optic';
            $core_count = $_POST['core_count'] ?? 24;
            $status = $_POST['status'] ?? 'planned';
            
            if (!$from_item_id || !$to_item_id) {
                $response['message'] = 'From and To items are required';
                break;
            }
            
            // Check if route already exists
            $query = "SELECT id FROM cable_routes WHERE 
                     (from_item_id = :from_id AND to_item_id = :to_id) OR 
                     (from_item_id = :to_id AND to_item_id = :from_id)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':from_id', $from_item_id);
            $stmt->bindParam(':to_id', $to_item_id);
            $stmt->execute();
            
            if ($stmt->fetch()) {
                $response['message'] = 'Route already exists between these items';
                break;
            }
            
            $query = "INSERT INTO cable_routes (from_item_id, to_item_id, route_coordinates, distance, cable_type, core_count, status) 
                     VALUES (:from_item_id, :to_item_id, :route_coordinates, :distance, :cable_type, :core_count, :status)";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':from_item_id', $from_item_id);
            $stmt->bindParam(':to_item_id', $to_item_id);
            $stmt->bindParam(':route_coordinates', $route_coordinates);
            $stmt->bindParam(':distance', $distance);
            $stmt->bindParam(':cable_type', $cable_type);
            $stmt->bindParam(':core_count', $core_count);
            $stmt->bindParam(':status', $status);
            
            if ($stmt->execute()) {
                $route_id = $db->lastInsertId();
                $response['success'] = true;
                $response['message'] = 'Route created successfully';
                $response['route_id'] = $route_id;
            } else {
                $response['message'] = 'Failed to create route';
            }
            break;
            
        case 'PUT':
            // Check admin permission for update operations
            if (!isAdmin()) {
                http_response_code(403);
                echo json_encode(array('success' => false, 'message' => 'Admin permission required for update operations'));
                exit();
            }
            
            // Update route - now using $_POST populated by parser
            $put_data = $_POST;
            
            // Debug logging
            error_log('🔧 Route PUT Request - Method: ' . $method);
            error_log('🔧 POST data: ' . print_r($put_data, true));
            
            $id = $put_data['id'] ?? null;
            
            if (!$id) {
                error_log('❌ Route update failed: No ID provided');
                $response['message'] = 'ID required for update';
                break;
            }
            
            // Build dynamic update query
            $update_fields = array();
            $params = array(':id' => $id);
            
            $allowed_fields = ['cable_type', 'core_count', 'status', 'distance', 'route_coordinates'];
            
            foreach ($allowed_fields as $field) {
                if (isset($put_data[$field])) {
                    $update_fields[] = "$field = :$field";
                    $params[":$field"] = $put_data[$field];
                }
            }
            
            if (empty($update_fields)) {
                $response['message'] = 'No fields to update';
                break;
            }
            
            $query = "UPDATE cable_routes SET " . implode(', ', $update_fields) . " WHERE id = :id";
            
            $stmt = $db->prepare($query);
            
            if ($stmt->execute($params)) {
                $response['success'] = true;
                $response['message'] = 'Route updated successfully';
            } else {
                $response['message'] = 'Failed to update route';
            }
            break;
            
        case 'DELETE':
            // Check admin permission for delete operations
            if (!isAdmin()) {
                http_response_code(403);
                echo json_encode(array('success' => false, 'message' => 'Admin permission required for delete operations'));
                exit();
            }
            
            $input = file_get_contents("php://input");
            $delete_data = array();
            
            // Try to parse JSON first, then form data
            $json_data = json_decode($input, true);
            if ($json_data) {
                $delete_data = $json_data;
            } else {
                parse_str($input, $delete_data);
            }
            
            // Also check for regular POST data (for compatibility)
            if (empty($delete_data)) {
                $delete_data = $_POST;
            }
            
            if (isset($delete_data['id'])) {
                // Delete single route
                $id = $delete_data['id'];
                
                $query = "DELETE FROM cable_routes WHERE id = :id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':id', $id);
                
                if ($stmt->execute()) {
                    $response['success'] = true;
                    $response['message'] = 'Route deleted successfully';
                } else {
                    $response['message'] = 'Failed to delete route';
                }
            } else if (isset($delete_data['item_id'])) {
                // Delete all routes connected to an item
                $item_id = $delete_data['item_id'];
                
                // Get route IDs first
                $query = "SELECT id FROM cable_routes WHERE from_item_id = :item_id OR to_item_id = :item_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':item_id', $item_id);
                $stmt->execute();
                $route_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
                
                // Delete routes
                $query = "DELETE FROM cable_routes WHERE from_item_id = :item_id OR to_item_id = :item_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':item_id', $item_id);
                
                if ($stmt->execute()) {
                    $response['success'] = true;
                    $response['message'] = 'Routes deleted successfully';
                    $response['deleted_routes'] = $route_ids;
                } else {
                    $response['message'] = 'Failed to delete routes';
                }
            } else {
                $response['message'] = 'ID or item_id required for deletion';
            }
            break;
            
        default:
            $response['message'] = 'Method not allowed';
            break;
    }
    
} catch (Exception $e) {
    $response['message'] = 'Database error: ' . $e->getMessage();
}

echo json_encode($response);
?>