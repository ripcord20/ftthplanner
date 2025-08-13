// App.js - FTTH Planner Application Logic

// Global variables
let editingItemId = null;
let tempClickLatLng = null;

// Initialize application
$(document).ready(function() {
    loadFormData();
    initializeEventListeners();
    
    // Add core capacity change listener
    $(document).on('change input', '#totalCoreCapacity, #coreUsed', calculateCoreAvailable);
});

// Load form data (tube colors, splitters)
function loadFormData() {
    // Load tube colors
    $.ajax({
        url: 'api/tube_colors.php',
        method: 'GET',
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        },
        success: function(response) {
            if (response.success) {
                // Populate tube color dropdown
                let tubeColorSelect = $('#tubeColor');
                tubeColorSelect.empty().append('<option value="">Pilih Warna Tube</option>');
                
                // Populate core color dropdown
                let coreColorSelect = $('#coreColor');
                coreColorSelect.empty().append('<option value="">Pilih Warna Core</option>');
                
                response.data.forEach(function(color) {
                    let option = `<option value="${color.id}" data-color="${color.hex_code}" style="border-left: 4px solid ${color.hex_code};">${color.color_name}</option>`;
                    tubeColorSelect.append(option);
                    coreColorSelect.append(option);
                });
            } else {
                console.error('Tube colors API error:', response.message);
            }
        },
        error: function(xhr, status, error) {
            console.error('Tube colors AJAX error:', error);
            if (xhr.status === 401) {
                console.warn('Tube colors loading failed: Authentication required');
            }
        }
    });
    
    // Load splitter types
    $.ajax({
        url: 'api/splitters.php',
        method: 'GET',
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        },
        success: function(response) {
            if (response.success) {
                let mainSplitterSelect = $('#splitterMain');
                let odpSplitterSelect = $('#splitterOdp');
                
                mainSplitterSelect.empty().append('<option value="">Pilih Splitter Utama</option>');
                odpSplitterSelect.empty().append('<option value="">Pilih Splitter ODP</option>');
                
                response.data.forEach(function(splitter) {
                    let option = `<option value="${splitter.id}">${splitter.ratio}</option>`;
                    
                    if (splitter.type === 'main') {
                        mainSplitterSelect.append(option);
                    } else {
                        odpSplitterSelect.append(option);
                    }
                });
            } else {
                console.error('Splitters API error:', response.message);
            }
        },
        error: function(xhr, status, error) {
            console.error('Splitters AJAX error:', error);
            if (xhr.status === 401) {
                console.warn('Splitters loading failed: Authentication required');
            }
        }
    });
}

// Initialize event listeners
function initializeEventListeners() {
    // Item form submission
    $('#itemForm').on('submit', function(e) {
        e.preventDefault();
        saveItem();
    });
    
    // Modal events
    $('#itemModal').on('hidden.bs.modal', function() {
        resetForm();
    });
    
    // Tube color change event to show color preview
    $('#tubeColor').on('change', function() {
        updateColorPreview();
    });
}

// Show add item modal
function showAddItemModal(lat = null, lng = null) {
    tempClickLatLng = lat && lng ? {lat: lat, lng: lng} : null;
    
    $('#itemModalTitle').text('Tambah Item FTTH');
    $('#itemId').val('');
    editingItemId = null;
    
    if (tempClickLatLng) {
        $('#itemLat').val(tempClickLatLng.lat);
        $('#itemLng').val(tempClickLatLng.lng);
    }
    
    $('#itemModal').modal('show');
}

// Add new item (from sidebar)
function addNewItem(itemType) {
    showAddItemModal();
    
    // Set item type based on parameter
    let itemTypeId = getItemTypeId(itemType);
    if (itemTypeId) {
        $('#itemType').val(itemTypeId);
    }
}

// Get item type ID from name
function getItemTypeId(typeName) {
    switch(typeName) {
        case 'OLT': return '1';
        case 'Tiang Tumpu': return '2';
        case 'Tiang ODP': return '3';
        case 'Tiang ODC': return '4';
        case 'Tiang Joint Closure': return '5';
        case 'Pelanggan': return '6';
        case 'Server': return '7';
        default: return '';
    }
}

// Edit existing item
function editItem(itemId) {
    editingItemId = itemId;
    
    $.ajax({
        url: 'api/items.php',
        method: 'GET',
        data: { id: itemId },
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        },
        success: function(response) {
            if (response.success && response.data) {
                let item = response.data;
                
                $('#itemModalTitle').text('Edit Item FTTH');
                $('#itemId').val(item.id);
                $('#itemType').val(item.item_type_id);
                $('#itemName').val(item.name);
                $('#itemDescription').val(item.description);
                $('#itemAddress').val(item.address);
                $('#itemLat').val(item.latitude);
                $('#itemLng').val(item.longitude);
                $('#tubeColor').val(item.tube_color_id);
                $('#coreColor').val(item.core_color_id);
                $('#cableType').val(item.item_cable_type || 'distribution');
                $('#totalCoreCapacity').val(item.total_core_capacity || 24);
                $('#coreUsed').val(item.core_used);
                $('#splitterMain').val(item.splitter_main_id);
                $('#splitterOdp').val(item.splitter_odp_id);
                $('#itemStatus').val(item.status);
                
                // Calculate and display core available
                setTimeout(() => calculateCoreAvailable(), 100);
                
                updateColorPreview();
                $('#itemModal').modal('show');
            } else {
                showNotification('Error loading item: ' + (response.message || 'Unknown error'), 'error');
            }
        },
        error: function(xhr, status, error) {
            console.error('Edit item AJAX error:', error, xhr.responseText);
            let errorMessage = 'Error loading item data';
            if (xhr.status === 401) {
                errorMessage = 'Authentication required - please login again';
                setTimeout(() => {
                    window.location.href = 'login.php';
                }, 2000);
            }
            showNotification(errorMessage, 'error');
        }
    });
}

// Save item (create or update)
function saveItem() {
    let method = editingItemId ? 'PUT' : 'POST';
    
    // Validate required fields
    if (!$('#itemType').val() || !$('#itemName').val()) {
        showNotification('Harap isi semua field yang wajib', 'warning');
        return;
    }
    
    // If no coordinates provided and not editing, get from temp click
    if (!$('#itemLat').val() && !$('#itemLng').val() && tempClickLatLng) {
        $('#itemLat').val(tempClickLatLng.lat);
        $('#itemLng').val(tempClickLatLng.lng);
    }
    
    // Always use POST with FormData for compatibility
    let formData = new FormData($('#itemForm')[0]);
    
    // Log original method and current state
    console.log('🔧 SAVEITEM DEBUG:');
    console.log('Original method:', method);
    console.log('editingItemId:', editingItemId);
    console.log('Item ID field value:', $('#itemId').val());
    
    // For PUT requests, add _method parameter
    if (method === 'PUT') {
        formData.append('_method', 'PUT');
        
        // Ensure ID is included for PUT request
        if (editingItemId && !formData.get('id')) {
            formData.set('id', editingItemId);
        }
        
        // Also ensure we have the ID from the hidden field
        if ($('#itemId').val() && !formData.get('id')) {
            formData.set('id', $('#itemId').val());
        }
        
        // Log all data being sent
        console.log('🚀 PUT Data being sent (all fields):');
        for (let pair of formData.entries()) {
            console.log('  ' + pair[0] + ': ' + pair[1]);
        }
    } else {
        console.log('🚀 POST Data being sent (new item)');
    }
    
    // Force POST method with explicit type declaration
    let requestConfig = {
        url: 'api/items.php',
        type: 'POST',     // Use 'type' instead of 'method' for better compatibility
        method: 'POST',   // Also set method for newer jQuery versions
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
        cache: false,     // Disable caching
        success: function(response) {
            if (response && response.success) {
                $('#itemModal').modal('hide');
                
                if (editingItemId) {
                    // Update existing marker
                    updateMarker(editingItemId, response.data);
                    showNotification('Item berhasil diupdate', 'success');
                } else {
                    // Add new marker
                    addMarkerToMap(response.data);
                    showNotification('Item berhasil ditambahkan', 'success');
                }
                
                updateStatistics();
            } else {
                showNotification(response?.message || 'Error saving item', 'error');
            }
        },
        error: function(xhr, status, error) {
            console.error('AJAX Error:', error, xhr.responseText);
            console.error('Response Text:', xhr.responseText);
            showNotification('Error saving item: ' + error, 'error');
        }
    };
    
    console.log('🚀 Final request config:', {
        url: requestConfig.url,
        type: requestConfig.type,
        method: requestConfig.method,
        dataType: requestConfig.dataType
    });
    
    // Ensure credentials are sent with request
    requestConfig.xhrFields = {
        withCredentials: true
    };
    
    $.ajax(requestConfig);
}

// Update marker on map
function updateMarker(itemId, itemData) {
    if (markers[itemId]) {
        // Remove old marker
        map.removeLayer(markers[itemId]);
        delete markers[itemId];
    }
    
    // Add updated marker
    addMarkerToMap(itemData);
}

// Delete item
function deleteItem(itemId) {
    if (confirm('Apakah Anda yakin ingin menghapus item ini?')) {
        $.ajax({
            url: 'api/items.php',
            method: 'DELETE',
            data: { id: itemId },
            success: function(response) {
                if (response.success) {
                    // Remove marker from map
                    if (markers[itemId]) {
                        map.removeLayer(markers[itemId]);
                        delete markers[itemId];
                    }
                    
                    // Remove any routes connected to this item
                    removeRoutesForItem(itemId);
                    
                    showNotification('Item berhasil dihapus', 'success');
                    updateStatistics();
                } else {
                    showNotification(response.message || 'Error deleting item', 'error');
                }
            },
            error: function() {
                showNotification('Error deleting item', 'error');
            }
        });
    }
}

// Remove routes connected to item
function removeRoutesForItem(itemId) {
    $.ajax({
        url: 'api/routes.php',
        method: 'DELETE',
        data: { item_id: itemId },
        success: function(response) {
            if (response.success && response.deleted_routes) {
                response.deleted_routes.forEach(function(routeId) {
                    if (routes[routeId]) {
                        map.removeLayer(routes[routeId]);
                        delete routes[routeId];
                    }
                });
            }
        }
    });
}

// Reset form
function resetForm() {
    $('#itemForm')[0].reset();
    $('#itemId').val('');
    editingItemId = null;
    tempClickLatLng = null;
    updateColorPreview();
}

// Update color preview
function updateColorPreview() {
    let selectedColor = $('#tubeColor option:selected').data('color');
    if (selectedColor) {
        $('#tubeColor').css('border-left', `5px solid ${selectedColor}`);
    } else {
        $('#tubeColor').css('border-left', 'none');
    }
}

// Show item list
function showItemList() {
    $.ajax({
        url: 'api/items.php',
        method: 'GET',
        success: function(response) {
            if (response.success) {
                let itemListHtml = generateItemListHtml(response.data);
                showModal('Daftar Item FTTH', itemListHtml, 'modal-xl');
            }
        },
        error: function() {
            showNotification('Error loading item list', 'error');
        }
    });
}

// Generate item list HTML
function generateItemListHtml(items) {
    let html = `
        <div class="mb-3 d-flex justify-content-between align-items-center">
            <div>
                <button id="deleteSelectedItems" class="btn btn-danger" onclick="deleteSelectedItems()" disabled>
                    <i class="fas fa-trash"></i> Hapus Terpilih (<span id="selectedItemCount">0</span>)
                </button>
            </div>
            <div>
                <small class="text-muted">Total: ${items.length} item</small>
            </div>
        </div>
        <div class="table-responsive">
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr>
                        <th width="50">
                            <input type="checkbox" id="selectAllItems" onchange="toggleSelectAllItems(this)">
                        </th>
                        <th>Jenis</th>
                        <th>Nama</th>
                        <th>Alamat</th>
                        <th>Koordinat</th>
                        <th>Status</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    items.forEach(function(item) {
        html += `
            <tr>
                <td>
                    <input type="checkbox" class="item-checkbox" value="${item.id}" onchange="updateSelectedItemCount()">
                </td>
                <td>
                    <i class="${getItemIcon(item.item_type_name)}" style="color: ${getItemColor(item.item_type_name)};"></i>
                    ${item.item_type_name}
                </td>
                <td>${item.name}</td>
                <td>${item.address || '-'}</td>
                <td>${(isNaN(parseFloat(item.latitude)) || isNaN(parseFloat(item.longitude))) ? 'Koordinat tidak valid' : `${parseFloat(item.latitude).toFixed(6)}, ${parseFloat(item.longitude).toFixed(6)}`}</td>
                <td>
                    <span class="badge badge-${getStatusBadgeClass(item.status)}">
                        ${getStatusText(item.status)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editItem(${item.id}); $('#genericModal').modal('hide');">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-info" onclick="focusOnItem(${item.id}); $('#genericModal').modal('hide');">
                        <i class="fas fa-map-marker-alt"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteItem(${item.id}); $('#genericModal').modal('hide');">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    return html;
}

// Get item icon
function getItemIcon(typeName) {
    switch(typeName) {
        case 'OLT': return 'fas fa-server';
        case 'Tiang Tumpu': return 'fas fa-tower-broadcast';
        case 'Tiang ODP':
        case 'ODP': return 'fas fa-project-diagram';
        case 'Tiang ODC':
        case 'ODC': return 'fas fa-network-wired';
        case 'Tiang Joint Closure': return 'fas fa-link';
        case 'Pelanggan': return 'fas fa-home';
        case 'Server': return 'fas fa-server';
        default: return 'fas fa-circle';
    }
}

// Get item color
function getItemColor(typeName) {
    switch(typeName) {
        case 'OLT': return '#FF6B6B';
        case 'Tiang Tumpu': return '#4ECDC4';
        case 'Tiang ODP': return '#45B7D1';
        case 'Tiang ODC': return '#96CEB4';
        case 'Tiang Joint Closure': return '#E74C3C';
        case 'Pelanggan': return '#FFA500';
        case 'Server': return '#8E44AD';
        default: return '#999';
    }
}

// Focus on item in map
function focusOnItem(itemId) {
    if (markers[itemId]) {
        let marker = markers[itemId];
        map.setView(marker.getLatLng(), 16);
        marker.openPopup();
    }
}

// Show route list
function showRouteList() {
    $.ajax({
        url: 'api/routes.php',
        method: 'GET',
        success: function(response) {
            if (response.success) {
                let routeListHtml = generateRouteListHtml(response.data);
                showModal('Daftar Routing Kabel', routeListHtml, 'modal-xl');
            }
        },
        error: function() {
            showNotification('Error loading route list', 'error');
        }
    });
}

// Generate route list HTML
function generateRouteListHtml(routes) {
    let html = `
        <div class="mb-3 d-flex justify-content-between align-items-center">
            <div>
                <button id="deleteSelectedRoutes" class="btn btn-danger" onclick="deleteSelectedRoutes()" disabled>
                    <i class="fas fa-trash"></i> Hapus Terpilih (<span id="selectedRouteCount">0</span>)
                </button>
            </div>
            <div>
                <small class="text-muted">Total: ${routes.length} routing</small>
            </div>
        </div>
        <div class="table-responsive">
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr>
                        <th width="50">
                            <input type="checkbox" id="selectAllRoutes" onchange="toggleSelectAllRoutes(this)">
                        </th>
                        <th>Dari</th>
                        <th>Ke</th>
                        <th>Jarak</th>
                        <th>Tipe Kabel</th>
                        <th>Core</th>
                        <th>Status</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    routes.forEach(function(route) {
        let distance = route.distance ? parseFloat(route.distance).toFixed(2) + ' m' : '-';
        
        html += `
            <tr>
                <td>
                    <input type="checkbox" class="route-checkbox" value="${route.id}" onchange="updateSelectedRouteCount()">
                </td>
                <td>${route.from_item_name || 'Unknown'}</td>
                <td>${route.to_item_name || 'Unknown'}</td>
                <td>${distance}</td>
                <td>${route.cable_type || '-'}</td>
                <td>${route.core_count || '-'}</td>
                <td>
                    <span class="badge badge-${getStatusBadgeClass(route.status)}">
                        ${getStatusText(route.status)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editRoute(${route.id}); $('#genericModal').modal('hide');" title="Edit Route">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-info" onclick="focusOnRoute(${route.id}); $('#genericModal').modal('hide');" title="Lihat di Peta">
                        <i class="fas fa-map-marker-alt"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteRoute(${route.id}); $('#genericModal').modal('hide');" title="Hapus Route">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    return html;
}

// Focus on route in map
function focusOnRoute(routeId) {
    if (routes[routeId]) {
        let route = routes[routeId];
        map.fitBounds(route.getBounds());
        route.openPopup();
    }
}

// Delete route
function deleteRoute(routeId) {
    if (confirm('Apakah Anda yakin ingin menghapus route ini?')) {
        $.ajax({
            url: 'api/routes.php',
            method: 'DELETE',
            data: { id: routeId },
            success: function(response) {
                if (response.success) {
                    if (routes[routeId]) {
                        map.removeLayer(routes[routeId]);
                        delete routes[routeId];
                    }
                    showNotification('Route berhasil dihapus', 'success');
                } else {
                    showNotification(response.message || 'Error deleting route', 'error');
                }
            },
            error: function() {
                showNotification('Error deleting route', 'error');
            }
        });
    }
}

// Generic modal function
function showModal(title, content, size = 'modal-lg') {
    if (!$('#genericModal').length) {
        $('body').append(`
            <div class="modal fade" id="genericModal" tabindex="-1" role="dialog">
                <div class="modal-dialog ${size}" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4 class="modal-title" id="genericModalTitle"></h4>
                            <button type="button" class="close" data-dismiss="modal">
                                <span>&times;</span>
                            </button>
                        </div>
                        <div class="modal-body" id="genericModalBody">
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Tutup</button>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }
    
    $('#genericModalTitle').text(title);
    $('#genericModalBody').html(content);
    $('#genericModal').modal('show');
}

// Edit route function
function editRoute(routeId) {
    // Get route data first
    $.ajax({
        url: 'api/routes.php',
        method: 'GET',
        data: { id: routeId },
        success: function(response) {
            if (response.success && response.data) {
                let route = response.data;
                showEditRouteModal(route);
            } else {
                showNotification('Error loading route data', 'error');
            }
        },
        error: function() {
            showNotification('Error loading route data', 'error');
        }
    });
}

// Show edit route modal
function showEditRouteModal(route) {
    let modalHtml = `
        <form id="editRouteForm">
            <input type="hidden" id="editRouteId" value="${route.id}">
            
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Dari Item</label>
                        <input type="text" class="form-control" value="${route.from_item_name}" readonly>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Ke Item</label>
                        <input type="text" class="form-control" value="${route.to_item_name}" readonly>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-4">
                    <div class="form-group">
                        <label for="editCableType">Tipe Kabel</label>
                        <select class="form-control" id="editCableType" name="cable_type">
                            <option value="Fiber Optic" ${route.cable_type === 'Fiber Optic' ? 'selected' : ''}>Fiber Optic</option>
                            <option value="ADSS" ${route.cable_type === 'ADSS' ? 'selected' : ''}>ADSS (All Dielectric Self-Supporting)</option>
                            <option value="OPGW" ${route.cable_type === 'OPGW' ? 'selected' : ''}>OPGW (Optical Ground Wire)</option>
                            <option value="Armored" ${route.cable_type === 'Armored' ? 'selected' : ''}>Armored Fiber</option>
                            <option value="Indoor" ${route.cable_type === 'Indoor' ? 'selected' : ''}>Indoor Fiber</option>
                            <option value="Outdoor" ${route.cable_type === 'Outdoor' ? 'selected' : ''}>Outdoor Fiber</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="form-group">
                        <label for="editCoreCount">Jumlah Core</label>
                        <select class="form-control" id="editCoreCount" name="core_count">
                            <option value="2" ${route.core_count == 2 ? 'selected' : ''}>2 Core</option>
                            <option value="4" ${route.core_count == 4 ? 'selected' : ''}>4 Core</option>
                            <option value="6" ${route.core_count == 6 ? 'selected' : ''}>6 Core</option>
                            <option value="8" ${route.core_count == 8 ? 'selected' : ''}>8 Core</option>
                            <option value="12" ${route.core_count == 12 ? 'selected' : ''}>12 Core</option>
                            <option value="24" ${route.core_count == 24 ? 'selected' : ''}>24 Core</option>
                            <option value="48" ${route.core_count == 48 ? 'selected' : ''}>48 Core</option>
                            <option value="72" ${route.core_count == 72 ? 'selected' : ''}>72 Core</option>
                            <option value="96" ${route.core_count == 96 ? 'selected' : ''}>96 Core</option>
                            <option value="144" ${route.core_count == 144 ? 'selected' : ''}>144 Core</option>
                            <option value="216" ${route.core_count == 216 ? 'selected' : ''}>216 Core</option>
                            <option value="288" ${route.core_count == 288 ? 'selected' : ''}>288 Core</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="form-group">
                        <label for="editRouteStatus">Status</label>
                        <select class="form-control" id="editRouteStatus" name="status">
                            <option value="planned" ${route.status === 'planned' ? 'selected' : ''}>Perencanaan</option>
                            <option value="installed" ${route.status === 'installed' ? 'selected' : ''}>Terpasang</option>
                            <option value="maintenance" ${route.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label>Jarak</label>
                <input type="text" class="form-control" value="${route.distance ? parseFloat(route.distance).toFixed(2) + ' m' : 'N/A'}" readonly>
                <small class="text-muted">Jarak dihitung otomatis berdasarkan routing</small>
            </div>
            
            <div class="text-right">
                <button type="button" class="btn btn-secondary" onclick="$('#routeEditModal').modal('hide')">Batal</button>
                <button type="submit" class="btn btn-primary">Update Route</button>
            </div>
        </form>
    `;
    
    // Create modal if doesn't exist
    if (!$('#routeEditModal').length) {
        $('body').append(`
            <div class="modal fade" id="routeEditModal" tabindex="-1" role="dialog">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4 class="modal-title">Edit Routing Kabel</h4>
                            <button type="button" class="close" data-dismiss="modal">
                                <span>&times;</span>
                            </button>
                        </div>
                        <div class="modal-body" id="routeEditModalBody">
                        </div>
                    </div>
                </div>
            </div>
        `);
    }
    
    $('#routeEditModalBody').html(modalHtml);
    $('#routeEditModal').modal('show');
    
    // Handle form submission
    $('#editRouteForm').on('submit', function(e) {
        e.preventDefault();
        saveRouteEdit();
    });
}

// Save route edit
function saveRouteEdit() {
    let formData = new FormData();
    formData.append('_method', 'PUT');
    formData.append('id', $('#editRouteId').val());
    formData.append('cable_type', $('#editCableType').val());
    formData.append('core_count', $('#editCoreCount').val());
    formData.append('status', $('#editRouteStatus').val());
    
    console.log('🚀 Route Edit Data being sent:');
    for (let pair of formData.entries()) {
        console.log('  ' + pair[0] + ': ' + pair[1]);
    }
    
    $.ajax({
        url: 'api/routes.php',
        type: 'POST',
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
        cache: false,
        success: function(response) {
            console.log('✅ Route update response:', response);
            if (response.success) {
                $('#routeEditModal').modal('hide');
                showNotification('Route berhasil diupdate', 'success');
                
                // Refresh route list if open
                if ($('#genericModal').hasClass('show')) {
                    showRouteList();
                }
                
                // Update route on map
                loadRoutes();
            } else {
                console.error('❌ Route update failed:', response.message);
                showNotification(response.message || 'Error updating route', 'error');
            }
        },
        error: function(xhr, status, error) {
            console.error('❌ AJAX Error:', error, xhr.responseText);
            console.error('Response Text:', xhr.responseText);
            try {
                let errorResponse = JSON.parse(xhr.responseText);
                showNotification(errorResponse.message || 'Error updating route', 'error');
            } catch(e) {
                showNotification('Error updating route: ' + error, 'error');
            }
        }
    });
}

// Calculate core available
function calculateCoreAvailable() {
    let totalCapacity = parseInt($('#totalCoreCapacity').val()) || 0;
    let coreUsed = parseInt($('#coreUsed').val()) || 0;
    let coreAvailable = totalCapacity - coreUsed;
    
    $('#coreAvailable').val(coreAvailable + ' / ' + totalCapacity + ' Core');
    
    // Set color based on availability
    if (coreAvailable <= 0) {
        $('#coreAvailable').removeClass('text-success text-warning').addClass('text-danger');
    } else if (coreAvailable <= totalCapacity * 0.2) {
        $('#coreAvailable').removeClass('text-success text-danger').addClass('text-warning');
    } else {
        $('#coreAvailable').removeClass('text-danger text-warning').addClass('text-success');
    }
}

// Sync core usage from routes
function syncCoreUsageFromRoutes(itemId) {
    if (!itemId) return;
    
    $.ajax({
        url: 'api/routes.php',
        method: 'GET',
        success: function(response) {
            if (response.success) {
                let totalCoreUsed = 0;
                
                response.data.forEach(function(route) {
                    if (route.from_item_id == itemId || route.to_item_id == itemId) {
                        totalCoreUsed += parseInt(route.core_count) || 0;
                    }
                });
                
                // Update core used in form
                $('#coreUsed').val(totalCoreUsed);
                calculateCoreAvailable();
                
                console.log(`📊 Core usage synced for item ${itemId}: ${totalCoreUsed} cores used`);
            }
        },
        error: function() {
            console.error('Failed to sync core usage from routes');
        }
    });
}

// Enhanced edit item to include core sync
function editItemEnhanced(itemId) {
    editItem(itemId);
    // Sync core usage after loading item data
    setTimeout(() => syncCoreUsageFromRoutes(itemId), 500);
}

// Show item detail
function showItemDetail(itemId) {
    $.ajax({
        url: 'api/items.php',
        method: 'GET',
        data: { id: itemId },
        success: function(response) {
            if (response.success && response.data) {
                let item = response.data;
                showItemDetailModal(item);
            } else {
                showNotification('Error loading item data', 'error');
            }
        },
        error: function() {
            showNotification('Error loading item data', 'error');
        }
    });
}

// Show item detail modal
function showItemDetailModal(item) {
    let modalHtml = `
        <div class="row">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header bg-info text-white">
                        <h5 class="mb-0">
                            <i class="${getItemIcon(item.item_type_name)}"></i> 
                            ${item.name}
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <!-- Basic Information -->
                            <div class="col-md-6">
                                <h6 class="text-primary mb-3">
                                    <i class="fas fa-info-circle"></i> Informasi Dasar
                                </h6>
                                <table class="table table-sm">
                                    <tr>
                                        <td><strong>ID:</strong></td>
                                        <td>${item.id}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Jenis Item:</strong></td>
                                        <td>
                                            <span class="badge badge-primary">
                                                <i class="${getItemIcon(item.item_type_name)}"></i> 
                                                ${item.item_type_name}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><strong>Nama:</strong></td>
                                        <td>${item.name}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Deskripsi:</strong></td>
                                        <td>${item.description || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Alamat:</strong></td>
                                        <td>${item.address || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Status:</strong></td>
                                        <td>
                                            <span class="badge badge-${getStatusBadgeClass(item.status)}">
                                                ${getStatusText(item.status)}
                                            </span>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Location Information -->
                            <div class="col-md-6">
                                <h6 class="text-success mb-3">
                                    <i class="fas fa-map-marker-alt"></i> Informasi Lokasi
                                </h6>
                                <table class="table table-sm">
                                    <tr>
                                        <td><strong>Latitude:</strong></td>
                                        <td>${item.latitude}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Longitude:</strong></td>
                                        <td>${item.longitude}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Koordinat:</strong></td>
                                        <td>
                                            <code>${item.latitude}, ${item.longitude}</code>
                                            <button class="btn btn-sm btn-outline-secondary ml-2" onclick="copyToClipboard('${item.latitude}, ${item.longitude}')" title="Copy Koordinat">
                                                <i class="fas fa-copy"></i>
                                            </button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><strong>Google Maps:</strong></td>
                                        <td>
                                            <a href="https://maps.google.com/?q=${item.latitude},${item.longitude}" target="_blank" class="btn btn-sm btn-outline-primary">
                                                <i class="fas fa-external-link-alt"></i> Buka di Maps
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <div class="row">
                            <!-- Core & Cable Information -->
                            <div class="col-md-6">
                                <h6 class="text-warning mb-3">
                                    <i class="fas fa-network-wired"></i> Informasi Core & Kabel
                                </h6>
                                <table class="table table-sm">
                                    <tr>
                                        <td><strong>Warna Tube:</strong></td>
                                        <td>
                                            ${item.tube_color_name ? `
                                                <span class="color-box" style="background-color: ${item.hex_code}; width: 20px; height: 20px; display: inline-block; margin-right: 8px; border: 1px solid #ccc;"></span>
                                                ${item.tube_color_name}
                                            ` : '-'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><strong>Warna Core:</strong></td>
                                        <td>
                                            ${item.core_color_name ? `
                                                <span class="color-box" style="background-color: ${item.core_hex_code}; width: 20px; height: 20px; display: inline-block; margin-right: 8px; border: 1px solid #ccc;"></span>
                                                ${item.core_color_name}
                                            ` : '-'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><strong>Jenis Kabel:</strong></td>
                                        <td>
                                            ${item.item_cable_type ? `
                                                <span class="badge badge-${getCableTypeBadge(item.item_cable_type)}">
                                                    ${getCableTypeText(item.item_cable_type)}
                                                </span>
                                            ` : '-'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><strong>Kapasitas Core:</strong></td>
                                        <td>
                                            <span class="badge badge-secondary">${item.total_core_capacity || 24} Core</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><strong>Core Digunakan:</strong></td>
                                        <td>
                                            <span class="badge badge-${getCoreUsageBadge(item.core_used, item.total_core_capacity)}">
                                                ${item.core_used || 0} Core
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><strong>Core Tersedia:</strong></td>
                                        <td>
                                            <span class="badge badge-${getCoreUsageBadge(item.core_used, item.total_core_capacity)}">
                                                ${(item.total_core_capacity || 24) - (item.core_used || 0)} Core
                                            </span>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Splitter Information -->
                            <div class="col-md-6">
                                <h6 class="text-danger mb-3">
                                    <i class="fas fa-project-diagram"></i> Informasi Splitter
                                </h6>
                                <table class="table table-sm">
                                    <tr>
                                        <td><strong>Splitter Utama:</strong></td>
                                        <td>
                                            ${item.splitter_main_ratio ? `
                                                <span class="badge badge-info">${item.splitter_main_ratio}</span>
                                            ` : '-'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><strong>Splitter ODP:</strong></td>
                                        <td>
                                            ${item.splitter_odp_ratio ? `
                                                <span class="badge badge-warning">${item.splitter_odp_ratio}</span>
                                            ` : '-'}
                                        </td>
                                    </tr>
                                </table>
                                
                                <h6 class="text-secondary mb-3 mt-4">
                                    <i class="fas fa-clock"></i> Timestamp
                                </h6>
                                <table class="table table-sm">
                                    <tr>
                                        <td><strong>Dibuat:</strong></td>
                                        <td>${formatDate(item.created_at)}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Diupdate:</strong></td>
                                        <td>${formatDate(item.updated_at)}</td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer text-right">
                        <button type="button" class="btn btn-secondary" onclick="$('#itemDetailModal').modal('hide')">
                            <i class="fas fa-times"></i> Tutup
                        </button>
                        <button type="button" class="btn btn-primary" onclick="editItem(${item.id}); $('#itemDetailModal').modal('hide');">
                            <i class="fas fa-edit"></i> Edit Item
                        </button>
                        <button type="button" class="btn btn-success" onclick="focusOnItem(${item.id}); $('#itemDetailModal').modal('hide');">
                            <i class="fas fa-crosshairs"></i> Fokus di Peta
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Create modal if doesn't exist
    if (!$('#itemDetailModal').length) {
        $('body').append(`
            <div class="modal fade" id="itemDetailModal" tabindex="-1" role="dialog">
                <div class="modal-dialog modal-xl" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4 class="modal-title">
                                <i class="fas fa-info-circle"></i> Detail Item FTTH
                            </h4>
                            <button type="button" class="close" data-dismiss="modal">
                                <span>&times;</span>
                            </button>
                        </div>
                        <div class="modal-body" id="itemDetailModalBody">
                        </div>
                    </div>
                </div>
            </div>
        `);
    }
    
    $('#itemDetailModalBody').html(modalHtml);
    $('#itemDetailModal').modal('show');
}

// Helper function to copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        showNotification('Koordinat disalin ke clipboard', 'success');
    }).catch(function() {
        showNotification('Gagal menyalin koordinat', 'error');
    });
}

// Format date helper
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Export functions to global scope
window.showAddItemModal = showAddItemModal;
window.addNewItem = addNewItem;
window.editItem = editItem;
window.editItemEnhanced = editItemEnhanced;
window.deleteItem = deleteItem;
window.showItemDetail = showItemDetail;
window.showItemList = showItemList;
window.showRouteList = showRouteList;
window.focusOnItem = focusOnItem;
window.focusOnRoute = focusOnRoute;
window.deleteRoute = deleteRoute;
window.editRoute = editRoute;
window.calculateCoreAvailable = calculateCoreAvailable;
window.syncCoreUsageFromRoutes = syncCoreUsageFromRoutes;
window.copyToClipboard = copyToClipboard;
window.toggleSelectAllItems = toggleSelectAllItems;
window.updateSelectedItemCount = updateSelectedItemCount;
window.deleteSelectedItems = deleteSelectedItems;
window.toggleSelectAllRoutes = toggleSelectAllRoutes;
window.updateSelectedRouteCount = updateSelectedRouteCount;
window.deleteSelectedRoutes = deleteSelectedRoutes;

// Helper functions for display
function getCableTypeBadge(cableType) {
    switch(cableType) {
        case 'backbone': return 'danger';
        case 'distribution': return 'primary'; 
        case 'drop_core': return 'success';
        case 'feeder': return 'info';
        case 'branch': return 'warning';
        default: return 'secondary';
    }
}

// Multiple delete functions for items
function toggleSelectAllItems(checkboxElement) {
    const itemCheckboxes = document.querySelectorAll('.item-checkbox');
    itemCheckboxes.forEach(checkbox => {
        checkbox.checked = checkboxElement.checked;
    });
    updateSelectedItemCount();
}

function updateSelectedItemCount() {
    const checkedItems = document.querySelectorAll('.item-checkbox:checked');
    const count = checkedItems.length;
    const countElement = document.getElementById('selectedItemCount');
    const deleteButton = document.getElementById('deleteSelectedItems');
    
    if (countElement) countElement.textContent = count;
    if (deleteButton) deleteButton.disabled = count === 0;
    
    // Update select all checkbox
    const selectAll = document.getElementById('selectAllItems');
    const totalItems = document.querySelectorAll('.item-checkbox');
    if (selectAll && totalItems.length > 0) {
        selectAll.checked = count === totalItems.length;
        selectAll.indeterminate = count > 0 && count < totalItems.length;
    }
}

function deleteSelectedItems() {
    const checkedItems = document.querySelectorAll('.item-checkbox:checked');
    const itemIds = Array.from(checkedItems).map(checkbox => checkbox.value);
    
    if (itemIds.length === 0) {
        showNotification('Tidak ada item yang dipilih', 'warning');
        return;
    }
    
    if (!confirm(`Apakah Anda yakin ingin menghapus ${itemIds.length} item yang dipilih?`)) {
        return;
    }
    
    // Disable button and show loading
    const deleteButton = document.getElementById('deleteSelectedItems');
    const originalText = deleteButton.innerHTML;
    deleteButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghapus...';
    deleteButton.disabled = true;
    
    Promise.all(itemIds.map(id => deleteItemById(id)))
        .then(results => {
            const successful = results.filter(r => r.success).length;
            const failed = results.length - successful;
            
            if (failed === 0) {
                showNotification(`Berhasil menghapus ${successful} item`, 'success');
            } else {
                showNotification(`${successful} item berhasil dihapus, ${failed} gagal`, 'warning');
            }
            
            // Refresh the list
            setTimeout(() => {
                showItemList();
            }, 1000);
        })
        .catch(error => {
            console.error('Error deleting multiple items:', error);
            showNotification('Error menghapus item', 'error');
            deleteButton.innerHTML = originalText;
            deleteButton.disabled = false;
        });
}

function deleteItemById(itemId) {
    return new Promise((resolve) => {
        $.ajax({
            url: 'api/items.php',
            method: 'DELETE',
            dataType: 'json',
            data: JSON.stringify({id: itemId}),
            contentType: 'application/json',
            xhrFields: {
                withCredentials: true
            },
            success: function(response) {
                if (response.success) {
                    // Remove marker from map
                    if (markers[itemId]) {
                        map.removeLayer(markers[itemId]);
                        delete markers[itemId];
                    }
                    resolve({success: true, id: itemId});
                } else {
                    resolve({success: false, id: itemId, error: response.message});
                }
            },
            error: function() {
                resolve({success: false, id: itemId, error: 'Network error'});
            }
        });
    });
}

// Multiple delete functions for routes
function toggleSelectAllRoutes(checkboxElement) {
    const routeCheckboxes = document.querySelectorAll('.route-checkbox');
    routeCheckboxes.forEach(checkbox => {
        checkbox.checked = checkboxElement.checked;
    });
    updateSelectedRouteCount();
}

function updateSelectedRouteCount() {
    const checkedRoutes = document.querySelectorAll('.route-checkbox:checked');
    const count = checkedRoutes.length;
    const countElement = document.getElementById('selectedRouteCount');
    const deleteButton = document.getElementById('deleteSelectedRoutes');
    
    if (countElement) countElement.textContent = count;
    if (deleteButton) deleteButton.disabled = count === 0;
    
    // Update select all checkbox
    const selectAll = document.getElementById('selectAllRoutes');
    const totalRoutes = document.querySelectorAll('.route-checkbox');
    if (selectAll && totalRoutes.length > 0) {
        selectAll.checked = count === totalRoutes.length;
        selectAll.indeterminate = count > 0 && count < totalRoutes.length;
    }
}

function deleteSelectedRoutes() {
    const checkedRoutes = document.querySelectorAll('.route-checkbox:checked');
    const routeIds = Array.from(checkedRoutes).map(checkbox => checkbox.value);
    
    if (routeIds.length === 0) {
        showNotification('Tidak ada routing yang dipilih', 'warning');
        return;
    }
    
    if (!confirm(`Apakah Anda yakin ingin menghapus ${routeIds.length} routing yang dipilih?`)) {
        return;
    }
    
    // Disable button and show loading
    const deleteButton = document.getElementById('deleteSelectedRoutes');
    const originalText = deleteButton.innerHTML;
    deleteButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghapus...';
    deleteButton.disabled = true;
    
    Promise.all(routeIds.map(id => deleteRouteById(id)))
        .then(results => {
            const successful = results.filter(r => r.success).length;
            const failed = results.length - successful;
            
            if (failed === 0) {
                showNotification(`Berhasil menghapus ${successful} routing`, 'success');
            } else {
                showNotification(`${successful} routing berhasil dihapus, ${failed} gagal`, 'warning');
            }
            
            // Refresh the list
            setTimeout(() => {
                showRouteList();
            }, 1000);
        })
        .catch(error => {
            console.error('Error deleting multiple routes:', error);
            showNotification('Error menghapus routing', 'error');
            deleteButton.innerHTML = originalText;
            deleteButton.disabled = false;
        });
}

function deleteRouteById(routeId) {
    return new Promise((resolve) => {
        $.ajax({
            url: 'api/routes.php',
            method: 'DELETE',
            dataType: 'json',
            data: JSON.stringify({id: routeId}),
            contentType: 'application/json',
            xhrFields: {
                withCredentials: true
            },
            success: function(response) {
                if (response.success) {
                    // Remove route from map
                    if (routes[routeId]) {
                        map.removeLayer(routes[routeId]);
                        delete routes[routeId];
                    }
                    resolve({success: true, id: routeId});
                } else {
                    resolve({success: false, id: routeId, error: response.message});
                }
            },
            error: function() {
                resolve({success: false, id: routeId, error: 'Network error'});
            }
        });
    });
}

function getCableTypeText(cableType) {
    switch(cableType) {
        case 'backbone': return 'Backbone';
        case 'distribution': return 'Distribution';
        case 'drop_core': return 'Drop Core';
        case 'feeder': return 'Feeder';
        case 'branch': return 'Branch';
        default: return '-';
    }
}

function getCoreUsageBadge(used, total) {
    if (!used || !total) return 'secondary';
    
    let percentage = (used / total) * 100;
    if (percentage >= 90) return 'danger';
    if (percentage >= 70) return 'warning';
    if (percentage >= 50) return 'info';
    return 'success';
}

// Export helper functions
window.getCableTypeBadge = getCableTypeBadge;
window.getCableTypeText = getCableTypeText;
window.getCoreUsageBadge = getCoreUsageBadge;