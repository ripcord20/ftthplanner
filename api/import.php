<?php
// Turn off error display to prevent HTML in JSON response
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Try multiple paths for config file
    $configPaths = [
        '../config/database.php',
        'config/database.php',
        __DIR__ . '/../config/database.php'
    ];
    
    $configLoaded = false;
    foreach ($configPaths as $path) {
        if (file_exists($path)) {
            require_once $path;
            $configLoaded = true;
            break;
        }
    }
    
    if (!$configLoaded) {
        throw new Exception('Config file not found in any expected location');
    }
    
} catch (Exception $e) {
    $response = array('success' => false, 'message' => 'Database config error: ' . $e->getMessage());
    echo json_encode($response);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        throw new Exception('Database connection returned null');
    }
    
} catch (Exception $e) {
    $response = array('success' => false, 'message' => 'Database connection failed: ' . $e->getMessage());
    echo json_encode($response);
    exit();
}

$response = array('success' => false, 'message' => '', 'data' => null);

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        $response['message'] = 'Method not allowed';
        echo json_encode($response);
        exit();
    }

    // Handle batch import from KMZ/KML
    if (isset($_POST['batch_import']) && $_POST['batch_import'] === 'true') {
        // Log incoming data for debugging
        error_log("Import API - Received batch_import request");
        error_log("Import API - POST data: " . print_r($_POST, true));
        

        
        if (!isset($_POST['items'])) {
            $response['message'] = 'Missing items data in request';
            echo json_encode($response);
            exit();
        }
        
        $items = json_decode($_POST['items'], true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            $response['message'] = 'Invalid JSON in items data: ' . json_last_error_msg();
            echo json_encode($response);
            exit();
        }
        
        if (!$items || !is_array($items)) {
            $response['message'] = 'Items data is not a valid array';
            echo json_encode($response);
            exit();
        }
        
        if (empty($items)) {
            $response['message'] = 'No items to import';
            echo json_encode($response);
            exit();
        }

        $defaultItemType = $_POST['default_item_type'] ?? 5; // Pelanggan
        $importPrefix = $_POST['import_prefix'] ?? '';
        $replaceExisting = isset($_POST['replace_existing']) && $_POST['replace_existing'] === 'true';

        $importedCount = 0;
        $skippedCount = 0;
        $errorCount = 0;
        $errors = [];

        foreach ($items as $index => $item) {
            try {
                // Validate required fields
                if (!isset($item['latitude']) || !isset($item['longitude']) || !isset($item['name'])) {
                    $errorCount++;
                    $errors[] = "Item '{$item['name']}': Missing required fields";
                    continue;
                }

                // Check if item exists (by name)
                if ($replaceExisting) {
                    $checkQuery = "SELECT id FROM ftth_items WHERE name = :name";
                    $checkStmt = $db->prepare($checkQuery);
                    $checkStmt->bindParam(':name', $importPrefix . $item['name']);
                    $checkStmt->execute();
                    
                    if ($checkStmt->fetch()) {
                        // Update existing item
                        $updateQuery = "UPDATE ftth_items SET 
                                      item_type_id = :item_type_id,
                                      description = :description,
                                      latitude = :latitude,
                                      longitude = :longitude,
                                      address = :address,
                                      updated_at = CURRENT_TIMESTAMP
                                      WHERE name = :name";
                        
                        $updateStmt = $db->prepare($updateQuery);
                        
                        // Prepare variables for binding
                        $updateName = $importPrefix . $item['name'];
                        $updateDescription = $item['description'] ?? '';
                        $updateLatitude = $item['latitude'];
                        $updateLongitude = $item['longitude'];
                        $updateAddress = $item['address'] ?? '';
                        
                        $updateStmt->bindParam(':item_type_id', $defaultItemType);
                        $updateStmt->bindParam(':description', $updateDescription);
                        $updateStmt->bindParam(':latitude', $updateLatitude);
                        $updateStmt->bindParam(':longitude', $updateLongitude);
                        $updateStmt->bindParam(':address', $updateAddress);
                        $updateStmt->bindParam(':name', $updateName);
                        
                        if ($updateStmt->execute()) {
                            $importedCount++;
                        } else {
                            $errorCount++;
                            $errors[] = "Failed to update item: " . $importPrefix . $item['name'];
                        }
                        continue;
                    }
                }

                // Insert new item
                $insertQuery = "INSERT INTO ftth_items 
                              (item_type_id, name, description, latitude, longitude, address, 
                               tube_color_id, core_used, core_color_id, item_cable_type, 
                               total_core_capacity, splitter_main_id, splitter_odp_id, status) 
                              VALUES 
                              (:item_type_id, :name, :description, :latitude, :longitude, :address,
                               :tube_color_id, :core_used, :core_color_id, :item_cable_type,
                               :total_core_capacity, :splitter_main_id, :splitter_odp_id, :status)";

                $insertStmt = $db->prepare($insertQuery);
                
                // Prepare variables for binding (bindParam requires variables, not expressions)
                $itemName = $importPrefix . $item['name'];
                $itemDescription = $item['description'] ?? '';
                $itemLatitude = $item['latitude'];
                $itemLongitude = $item['longitude'];
                $itemAddress = $item['address'] ?? '';
                
                // Default values
                $tubeColorId = null;
                $coreUsed = 0;
                $coreColorId = null;
                $cableType = 'distribution';
                $totalCapacity = 24;
                $splitterMainId = null;
                $splitterOdpId = null;
                $status = 'active';
                
                // Bind parameters
                $insertStmt->bindParam(':item_type_id', $defaultItemType);
                $insertStmt->bindParam(':name', $itemName);
                $insertStmt->bindParam(':description', $itemDescription);
                $insertStmt->bindParam(':latitude', $itemLatitude);
                $insertStmt->bindParam(':longitude', $itemLongitude);
                $insertStmt->bindParam(':address', $itemAddress);
                $insertStmt->bindParam(':tube_color_id', $tubeColorId);
                $insertStmt->bindParam(':core_used', $coreUsed);
                $insertStmt->bindParam(':core_color_id', $coreColorId);
                $insertStmt->bindParam(':item_cable_type', $cableType);
                $insertStmt->bindParam(':total_core_capacity', $totalCapacity);
                $insertStmt->bindParam(':splitter_main_id', $splitterMainId);
                $insertStmt->bindParam(':splitter_odp_id', $splitterOdpId);
                $insertStmt->bindParam(':status', $status);

                if ($insertStmt->execute()) {
                    $importedCount++;
                } else {
                    $errorCount++;
                    $errors[] = "Failed to insert item: " . $importPrefix . $item['name'];
                }

            } catch (Exception $e) {
                $errorCount++;
                $errors[] = "Error processing item '{$item['name']}': " . $e->getMessage();
            }
        }

        $response['success'] = true;
        $response['data'] = [
            'imported' => $importedCount,
            'skipped' => $skippedCount,
            'errors' => $errorCount,
            'total' => count($items),
            'error_details' => $errors
        ];
        $response['message'] = "Import completed: {$importedCount} imported, {$errorCount} errors";

    } else {
        $response['message'] = 'Invalid request';
    }

} catch (Exception $e) {
    $response['message'] = 'Database error: ' . $e->getMessage();
    error_log("Import API Error: " . $e->getMessage());
}

echo json_encode($response);
?>