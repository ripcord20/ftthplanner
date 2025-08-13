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

// Function to manually parse multipart form data
function parseMultipartFormData($input, $contentType) {
    $data = array();
    
    // Extract boundary from content type
    if (preg_match('/boundary=(.+)$/', $contentType, $matches)) {
        $boundary = $matches[1];
        
        // Split the input by boundary
        $parts = array_slice(explode('--' . $boundary, $input), 1);
        
        foreach ($parts as $part) {
            // Skip empty parts and closing boundary
            if (trim($part) == '--' || empty(trim($part))) continue;
            
            // Split headers and body
            $sections = explode("\r\n\r\n", $part, 2);
            if (count($sections) != 2) continue;
            
            $headers = $sections[0];
            $body = rtrim($sections[1], "\r\n");
            
            // Extract field name from Content-Disposition header
            if (preg_match('/name="([^"]*)"/', $headers, $matches)) {
                $fieldName = $matches[1];
                $data[$fieldName] = $body;
            }
        }
    }
    
    return $data;
}

$database = new Database();
$db = $database->getConnection();

// Handle method override and multipart data parsing
$method = $_SERVER['REQUEST_METHOD'];
$parsed_data = array();

// Parse multipart form data manually if needed
if (($method === 'PUT' || $method === 'PATCH') && empty($_POST) && 
    isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') !== false) {
    
    // Force treat as POST to get parsed form data
    $raw_input = file_get_contents('php://input');
    $parsed_data = parseMultipartFormData($raw_input, $_SERVER['CONTENT_TYPE']);
    
    // If we found form data, treat this as a method override
    if (!empty($parsed_data)) {
        if (isset($parsed_data['_method'])) {
            $method = strtoupper($parsed_data['_method']);
            unset($parsed_data['_method']);
        }
        // Populate $_POST with parsed data for compatibility
        $_POST = $parsed_data;
    }
}

// Check for X-HTTP-Method-Override header
if (isset($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
    $method = $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'];
}

// Check for _method parameter (Laravel style) - now works with manually parsed data too
if (isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
    unset($_POST['_method']); // Clean it up
}

$response = array('success' => false, 'message' => '', 'data' => null);

// Log only important requests for production
if ($method === 'PUT' || $method === 'DELETE') {
    error_log("FTTH API - " . $method . " request, ID: " . (isset($_POST['id']) ? $_POST['id'] : 'N/A'));
}

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
                // Get single item
                $query = "SELECT i.*, it.name as item_type_name, it.icon, it.color,
                                tc.color_name as tube_color_name, tc.hex_code,
                                cc.color_name as core_color_name, cc.hex_code as core_hex_code,
                                sm.ratio as splitter_main_ratio,
                                so.ratio as splitter_odp_ratio
                         FROM ftth_items i
                         LEFT JOIN item_types it ON i.item_type_id = it.id
                         LEFT JOIN tube_colors tc ON i.tube_color_id = tc.id
                         LEFT JOIN tube_colors cc ON i.core_color_id = cc.id
                         LEFT JOIN splitter_types sm ON i.splitter_main_id = sm.id
                         LEFT JOIN splitter_types so ON i.splitter_odp_id = so.id
                         WHERE i.id = :id";
                
                $stmt = $db->prepare($query);
                $stmt->bindParam(':id', $_GET['id']);
                $stmt->execute();
                
                $item = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($item) {
                    $response['success'] = true;
                    $response['data'] = $item;
                } else {
                    $response['message'] = 'Item not found';
                }
            } else {
                // Get all items
                $query = "SELECT i.*, it.name as item_type_name, it.icon, it.color,
                                tc.color_name as tube_color_name, tc.hex_code,
                                cc.color_name as core_color_name, cc.hex_code as core_hex_code,
                                sm.ratio as splitter_main_ratio,
                                so.ratio as splitter_odp_ratio
                         FROM ftth_items i
                         LEFT JOIN item_types it ON i.item_type_id = it.id
                         LEFT JOIN tube_colors tc ON i.tube_color_id = tc.id
                         LEFT JOIN tube_colors cc ON i.core_color_id = cc.id
                         LEFT JOIN splitter_types sm ON i.splitter_main_id = sm.id
                         LEFT JOIN splitter_types so ON i.splitter_odp_id = so.id
                         ORDER BY i.created_at DESC";
                
                $stmt = $db->prepare($query);
                $stmt->execute();
                
                $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $response['success'] = true;
                $response['data'] = $items;
            }
            break;
            
        case 'POST':
            // Check admin permission for create operations
            if (!isAdmin()) {
                http_response_code(403);
                echo json_encode(array('success' => false, 'message' => 'Admin permission required for create operations'));
                exit();
            }
            
            // Create new item
            $item_type_id = $_POST['item_type'] ?? null;
            $name = $_POST['name'] ?? null;
            $description = $_POST['description'] ?? null;
            $latitude = $_POST['latitude'] ?? null;
            $longitude = $_POST['longitude'] ?? null;
            $address = $_POST['address'] ?? null;
            // Handle foreign key fields - convert empty strings to NULL
            $tube_color_id = (!empty($_POST['tube_color_id']) && $_POST['tube_color_id'] !== '0') ? $_POST['tube_color_id'] : null;
            $core_used = (!empty($_POST['core_used']) && $_POST['core_used'] !== '0') ? $_POST['core_used'] : null;
            $core_color_id = (!empty($_POST['core_color_id']) && $_POST['core_color_id'] !== '0') ? $_POST['core_color_id'] : null;
            $item_cable_type = $_POST['item_cable_type'] ?? 'distribution';
            $total_core_capacity = $_POST['total_core_capacity'] ?? 24;
            $splitter_main_id = (!empty($_POST['splitter_main_id']) && $_POST['splitter_main_id'] !== '0') ? $_POST['splitter_main_id'] : null;
            $splitter_odp_id = (!empty($_POST['splitter_odp_id']) && $_POST['splitter_odp_id'] !== '0') ? $_POST['splitter_odp_id'] : null;
            $status = $_POST['status'] ?? 'active';
            
            if (!$item_type_id || !$name || !$latitude || !$longitude) {
                $response['message'] = 'Required fields missing';
                break;
            }
            
            $query = "INSERT INTO ftth_items (item_type_id, name, description, latitude, longitude, address, tube_color_id, core_used, core_color_id, item_cable_type, total_core_capacity, splitter_main_id, splitter_odp_id, status) 
                     VALUES (:item_type_id, :name, :description, :latitude, :longitude, :address, :tube_color_id, :core_used, :core_color_id, :item_cable_type, :total_core_capacity, :splitter_main_id, :splitter_odp_id, :status)";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':item_type_id', $item_type_id);
            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':description', $description);
            $stmt->bindParam(':latitude', $latitude);
            $stmt->bindParam(':longitude', $longitude);
            $stmt->bindParam(':address', $address);
            $stmt->bindParam(':tube_color_id', $tube_color_id);
            $stmt->bindParam(':core_used', $core_used);
            $stmt->bindParam(':core_color_id', $core_color_id);
            $stmt->bindParam(':item_cable_type', $item_cable_type);
            $stmt->bindParam(':total_core_capacity', $total_core_capacity);
            $stmt->bindParam(':splitter_main_id', $splitter_main_id);
            $stmt->bindParam(':splitter_odp_id', $splitter_odp_id);
            $stmt->bindParam(':status', $status);
            
            if ($stmt->execute()) {
                $item_id = $db->lastInsertId();
                
                // Get the created item with joins
                $query = "SELECT i.*, it.name as item_type_name, it.icon, it.color,
                                tc.color_name as tube_color_name, tc.hex_code,
                                cc.color_name as core_color_name, cc.hex_code as core_hex_code,
                                sm.ratio as splitter_main_ratio,
                                so.ratio as splitter_odp_ratio
                         FROM ftth_items i
                         LEFT JOIN item_types it ON i.item_type_id = it.id
                         LEFT JOIN tube_colors tc ON i.tube_color_id = tc.id
                         LEFT JOIN tube_colors cc ON i.core_color_id = cc.id
                         LEFT JOIN splitter_types sm ON i.splitter_main_id = sm.id
                         LEFT JOIN splitter_types so ON i.splitter_odp_id = so.id
                         WHERE i.id = :id";
                
                $stmt = $db->prepare($query);
                $stmt->bindParam(':id', $item_id);
                $stmt->execute();
                
                $response['success'] = true;
                $response['message'] = 'Item created successfully';
                $response['data'] = $stmt->fetch(PDO::FETCH_ASSOC);
            } else {
                $response['message'] = 'Failed to create item';
            }
            break;
            
        case 'PUT':
            // Check admin permission for update operations
            if (!isAdmin()) {
                http_response_code(403);
                echo json_encode(array('success' => false, 'message' => 'Admin permission required for update operations'));
                exit();
            }
            
            // Update item - now $_POST should be properly populated
            $put_data = $_POST;
            
            $id = $put_data['id'] ?? null;
            
            if (!$id) {
                $response['message'] = 'ID required for update';
                break;
            }
            
            // Build dynamic update query
            $update_fields = array();
            $params = array(':id' => $id);
            
            $allowed_fields = ['item_type', 'name', 'description', 'latitude', 'longitude', 'address', 'tube_color_id', 'core_used', 'core_color_id', 'item_cable_type', 'total_core_capacity', 'splitter_main_id', 'splitter_odp_id', 'status'];
            
            foreach ($allowed_fields as $field) {
                if (isset($put_data[$field])) {
                    $db_field = $field === 'item_type' ? 'item_type_id' : $field;
                    $update_fields[] = "$db_field = :$field";
                    
                    // Handle empty values for foreign key fields - convert to NULL
                    $value = $put_data[$field];
                    if (in_array($field, ['tube_color_id', 'core_color_id', 'splitter_main_id', 'splitter_odp_id']) && 
                        ($value === '' || $value === '0' || $value === 0)) {
                        $value = null;
                    }
                    
                    $params[":$field"] = $value;
                }
            }
            
            if (empty($update_fields)) {
                $response['message'] = 'No fields to update';
                break;
            }
            
            $query = "UPDATE ftth_items SET " . implode(', ', $update_fields) . " WHERE id = :id";
            
            $stmt = $db->prepare($query);
            
            if ($stmt->execute($params)) {
                // Get updated item
                $query = "SELECT i.*, it.name as item_type_name, it.icon, it.color,
                                tc.color_name as tube_color_name, tc.hex_code,
                                cc.color_name as core_color_name, cc.hex_code as core_hex_code,
                                sm.ratio as splitter_main_ratio,
                                so.ratio as splitter_odp_ratio
                         FROM ftth_items i
                         LEFT JOIN item_types it ON i.item_type_id = it.id
                         LEFT JOIN tube_colors tc ON i.tube_color_id = tc.id
                         LEFT JOIN tube_colors cc ON i.core_color_id = cc.id
                         LEFT JOIN splitter_types sm ON i.splitter_main_id = sm.id
                         LEFT JOIN splitter_types so ON i.splitter_odp_id = so.id
                         WHERE i.id = :id";
                
                $stmt = $db->prepare($query);
                $stmt->bindParam(':id', $id);
                $stmt->execute();
                
                $response['success'] = true;
                $response['message'] = 'Item updated successfully';
                $response['data'] = $stmt->fetch(PDO::FETCH_ASSOC);
            } else {
                $response['message'] = 'Failed to update item';
            }
            break;
            
        case 'DELETE':
            // Check admin permission for delete operations
            if (!isAdmin()) {
                http_response_code(403);
                echo json_encode(array('success' => false, 'message' => 'Admin permission required for delete operations'));
                exit();
            }
            
            // Delete item
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
            
            $id = $delete_data['id'] ?? null;
            
            if (!$id) {
                $response['message'] = 'ID required for deletion';
                break;
            }
            
            // Delete related routes first
            $query = "DELETE FROM cable_routes WHERE from_item_id = :id OR to_item_id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            
            // Delete the item
            $query = "DELETE FROM ftth_items WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $id);
            
            if ($stmt->execute()) {
                $response['success'] = true;
                $response['message'] = 'Item deleted successfully';
            } else {
                $response['message'] = 'Failed to delete item';
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