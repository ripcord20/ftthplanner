// Map.js - FTTH Planner Map Functionality

let map;
let markers = {};
let routes = {};
let isRoutingMode = false;
let routingFromItem = null;
let routingType = 'road'; // 'road' or 'straight'
let currentRoutes = [];

// Initialize map
function initMap() {
    // Create map with enhanced options
    map = L.map('map', {
        center: [-6.2088, 106.8456], // Jakarta, Indonesia
        zoom: 11,
        minZoom: 5,
        maxZoom: 20,
        zoomControl: false, // We'll add custom zoom control
        fullscreenControl: true,
        fullscreenControlOptions: {
            position: 'topleft'
        }
    });

    // Define multiple tile layers
    const tileLayers = {
        "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }),
        
        "CartoDB Positron": L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 20
        }),
        
        "CartoDB Dark": L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 20
        }),
        
        "Satellite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
            maxZoom: 20
        }),
        
        "Terrain": L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
            maxZoom: 17
        }),
        
        "Google Hybrid": L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
            attribution: '&copy; Google',
            maxZoom: 20
        })
    };
    
    // Add default layer (OpenStreetMap)
    tileLayers["OpenStreetMap"].addTo(map);
    
    // Add layer control
    L.control.layers(tileLayers, null, {
        position: 'topright',
        collapsed: false
    }).addTo(map);
    
    // Add custom zoom control with home button
    const zoomControl = L.control.zoom({
        position: 'topleft'
    }).addTo(map);
    
    // Add home button to zoom control
    const homeControl = L.Control.extend({
        options: {
            position: 'topleft'
        },
        onAdd: function(map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            container.style.backgroundColor = 'white';
            container.style.backgroundImage = 'none';
            container.style.width = '26px';
            container.style.height = '26px';
            container.style.cursor = 'pointer';
            container.innerHTML = '<i class="fas fa-home" style="font-size: 14px; line-height: 26px; text-align: center; width: 26px; display: block;"></i>';
            container.title = 'Zoom to Indonesia';
            
            container.onclick = function() {
                map.setView([-2.5, 118], 5); // Indonesia overview
            };
            
            return container;
        }
    });
    
    new homeControl().addTo(map);
    
    // Add scale control
    L.control.scale({
        position: 'bottomright',
        metric: true,
        imperial: false
    }).addTo(map);
    
    // Add coordinates display
    const coordsControl = L.control({position: 'bottomleft'});
    coordsControl.onAdd = function(map) {
        this._div = L.DomUtil.create('div', 'leaflet-control-coords');
        this._div.style.background = 'rgba(255,255,255,0.8)';
        this._div.style.padding = '5px';
        this._div.style.margin = '0';
        this._div.style.fontSize = '11px';
        this._div.innerHTML = 'Move mouse over map';
        return this._div;
    };
    coordsControl.update = function(lat, lng) {
        this._div.innerHTML = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    };
    coordsControl.addTo(map);
    
    // Update coordinates on mouse move
    map.on('mousemove', function(e) {
        coordsControl.update(e.latlng.lat, e.latlng.lng);
    });
    
    // Enhanced zoom behavior
    map.on('zoomend', function() {
        const zoom = map.getZoom();
        if (zoom < 10) {
            // Hide detailed markers at low zoom
            Object.values(markers).forEach(marker => {
                if (marker._icon) {
                    marker._icon.style.opacity = '0.7';
                }
            });
        } else {
            // Show detailed markers at high zoom
            Object.values(markers).forEach(marker => {
                if (marker._icon) {
                    marker._icon.style.opacity = '1';
                }
            });
        }
    });

    // Add map click event for adding new items
    map.on('click', function(e) {
        if (!isRoutingMode) {
            showAddItemModal(e.latlng.lat, e.latlng.lng);
        }
    });

    // Load existing items with delay to ensure session is ready
    setTimeout(function() {
        console.log('🕐 Loading items after session initialization...');
        loadItems();
        loadRoutes();
    }, 500);
    
    // Add legend
    addMapLegend();
    
    console.log('🗺️ Enhanced map initialized with multiple tile layers and zoom controls');
    
    // Add loading indicator
    const mapContainer = document.getElementById('map');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'map-loading';
    loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading map...';
    mapContainer.appendChild(loadingDiv);
    
    // Hide loading indicator after tiles load
    map.on('tilesloaded', function() {
        if (loadingDiv.parentNode) {
            loadingDiv.parentNode.removeChild(loadingDiv);
        }
    });
}

// Create custom marker icon
function createCustomIcon(itemType, color) {
    let iconClass = 'fas fa-circle';
    
    switch(itemType) {
        case 'OLT':
        case '1':
            iconClass = 'fas fa-server';
            break;
        case 'Tiang Tumpu':
        case '2':
            iconClass = 'fas fa-tower-broadcast';
            break;
        case 'Tiang ODP':
        case 'ODP':
        case '3':
            iconClass = 'fas fa-project-diagram';
            break;
        case 'Tiang ODC':
        case 'ODC':
        case '4':
            iconClass = 'fas fa-network-wired';
            break;
        case 'Server':
        case '7':
            iconClass = 'fas fa-server';
            break;
        case 'Tiang Joint Closure':
        case '5':
            iconClass = 'fas fa-link';
            break;
        case 'Pelanggan':
        case '6':
            iconClass = 'fas fa-home';
            break;
    }

    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="custom-marker marker-${itemType.toLowerCase().replace(' ', '')}" style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><i class="${iconClass}" style="color: white; font-size: 14px;"></i></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
    });
}

// Create popup content for item
function createPopupContent(item) {
    let tubeColorName = item.tube_color_name || 'Tidak ada';
    let splitterMain = item.splitter_main_ratio || 'Tidak ada';
    let splitterOdp = item.splitter_odp_ratio || 'Tidak ada';
    
    return `
        <div>
            <h5><i class="${getItemIcon(item.item_type_name)}"></i> ${item.name}</h5>
            <div class="popup-info">
                <div class="info-row">
                    <span class="info-label">Jenis:</span> ${item.item_type_name}
                </div>
                ${item.description ? `<div class="info-row"><span class="info-label">Deskripsi:</span> ${item.description}</div>` : ''}
                ${item.address ? `<div class="info-row"><span class="info-label">Alamat:</span> ${item.address}</div>` : ''}
                <div class="info-row">
                    <span class="info-label">Warna Tube:</span> ${tubeColorName}
                </div>
                ${item.core_used ? `<div class="info-row"><span class="info-label">Core Digunakan:</span> ${item.core_used}</div>` : ''}
                <div class="info-row">
                    <span class="info-label">Splitter Utama:</span> ${splitterMain}
                </div>
                <div class="info-row">
                    <span class="info-label">Splitter ODP:</span> ${splitterOdp}
                </div>
                <div class="info-row">
                    <span class="info-label">Status:</span> 
                    <span class="badge badge-${getStatusBadgeClass(item.status)}">${getStatusText(item.status)}</span>
                </div>
            </div>
            <div class="popup-actions">
                <button class="btn btn-info btn-sm" onclick="showItemDetail(${item.id})" title="Lihat Detail Lengkap">
                    <i class="fas fa-info-circle"></i> Detail
                </button>
                <button class="btn btn-primary btn-sm" onclick="editItem(${item.id})" title="Edit Item">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-success btn-sm" onclick="startRoadRouting(${item.id})" title="Buat Routing Mengikuti Jalan">
                    <i class="fas fa-route"></i> Route Jalan
                </button>
                <button class="btn btn-warning btn-sm" onclick="startStraightLineRouting(${item.id})" title="Buat Routing Garis Lurus">
                    <i class="fas fa-minus"></i> Garis Lurus
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteItem(${item.id})" title="Hapus Item">
                    <i class="fas fa-trash"></i> Hapus
                </button>
            </div>
        </div>
    `;
}

// Get item icon based on type (moved to bottom for global export)

// Get status badge class
function getStatusBadgeClass(status) {
    switch(status) {
        case 'active': return 'success';
        case 'inactive': return 'secondary';
        case 'maintenance': return 'warning';
        default: return 'primary';
    }
}

// Get status text
function getStatusText(status) {
    switch(status) {
        case 'active': return 'Aktif';
        case 'inactive': return 'Tidak Aktif';
        case 'maintenance': return 'Maintenance';
        default: return status;
    }
}

// Load items from database
function loadItems(retryCount = 0) {
    console.log('🔄 Loading items... (attempt ' + (retryCount + 1) + ')');
    
    $.ajax({
        url: 'api/items.php',
        method: 'GET',
        dataType: 'json',
        // Note: xhrFields removed to avoid conflict with global ajaxSetup
        beforeSend: function(xhr) {
            console.log('📤 Sending request to api/items.php');
            console.log('Session cookie:', document.cookie);
        },
        success: function(response, status, xhr) {
            console.log('📥 Items API Response:', response);
            console.log('Response status:', xhr.status);
            
            if (response && response.success) {
                console.log('✅ Items loaded successfully:', response.data.length, 'items');
                response.data.forEach(function(item) {
                    addMarkerToMap(item);
                });
                updateStatistics();
            } else {
                console.error('❌ Load items API error:', response ? response.message : 'No response');
                showNotification('Error loading items: ' + (response ? response.message : 'Invalid response'), 'error');
            }
        },
        error: function(xhr, status, error) {
            console.error('💥 Load items AJAX error:');
            console.error('Status:', status);
            console.error('Error:', error);
            console.error('Response Text:', xhr.responseText);
            console.error('Status Code:', xhr.status);
            console.error('Response Headers:', xhr.getAllResponseHeaders());
            
            // Retry up to 2 times for 401 errors (session issues)
            if (xhr.status === 401 && retryCount < 2) {
                console.warn('🔄 Retrying loadItems due to auth error...');
                setTimeout(function() {
                    loadItems(retryCount + 1);
                }, 1000 * (retryCount + 1)); // Exponential backoff
                return;
            }
            
            let errorMessage = 'Error loading items';
            if (xhr.status === 401) {
                errorMessage = 'Authentication required - please login again';
                console.warn('🔒 Authentication failed, redirecting to login...');
                setTimeout(() => {
                    window.location.href = 'login.php';
                }, 2000);
            } else if (xhr.status === 0) {
                errorMessage = 'Network error - cannot connect to server';
            } else if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage = 'Error loading items: ' + xhr.responseJSON.message;
            } else {
                errorMessage = `Error loading items (Status: ${xhr.status})`;
            }
            
            // Only show notification on final attempt
            if (retryCount >= 2 || xhr.status !== 401) {
                showNotification(errorMessage, 'error');
            }
        }
    });
}

// Add marker to map
function addMarkerToMap(item) {
    let itemTypeColors = {
        'OLT': '#FF6B6B',
        'Tiang Tumpu': '#4ECDC4',
        'Tiang ODP': '#45B7D1',
        'Tiang ODC': '#96CEB4',
        'Tiang Joint Closure': '#E74C3C',
        'Pelanggan': '#FFA500',
        'Server': '#8E44AD'
    };
    
    let color = itemTypeColors[item.item_type_name] || '#999';
    let icon = createCustomIcon(item.item_type_name, color);
    
    let marker = L.marker([item.latitude, item.longitude], {
        icon: icon,
        draggable: true,
        itemType: item.item_type_name,
        itemId: item.id,
        itemData: item
    }).addTo(map);
    
    marker.bindPopup(createPopupContent(item));
    
    // Add drag event
    marker.on('dragend', function(e) {
        let newPos = e.target.getLatLng();
        updateItemPosition(item.id, newPos.lat, newPos.lng);
    });
    
    // Add click event for routing mode
    marker.on('click', function(e) {
        if (isRoutingMode) {
            handleRoutingClick(item);
            e.originalEvent.stopPropagation();
        }
    });
    
    markers[item.id] = marker;
}

// Update item position
function updateItemPosition(itemId, lat, lng) {
    // Use FormData with method override for consistency
    let formData = new FormData();
    formData.append('_method', 'PUT');
    formData.append('id', itemId);
    formData.append('latitude', lat);
    formData.append('longitude', lng);
    
    $.ajax({
        url: 'api/items.php',
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        },
        success: function(response) {
            if (response && response.success) {
                showNotification('Posisi item berhasil dipindahkan', 'success');
            } else {
                showNotification(response?.message || 'Error updating position', 'error');
            }
        },
        error: function(xhr, status, error) {
            console.error('Position update error:', error, xhr.responseText);
            showNotification('Error updating position: ' + error, 'error');
        }
    });
}

// Start routing mode
function startRouting(itemId) {
    showRoutingTypeModal(itemId);
}

// Show routing type selection modal
function showRoutingTypeModal(itemId) {
    let modalHtml = `
        <div class="row">
            <div class="col-md-12">
                <p class="mb-4">Pilih jenis routing yang ingin digunakan untuk membuat jalur kabel:</p>
                
                <div class="routing-options">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="card border-primary h-100">
                                <div class="card-body text-center">
                                    <i class="fas fa-route fa-3x text-primary mb-3"></i>
                                    <h5 class="card-title">Routing Jalan</h5>
                                    <p class="card-text">Membuat jalur mengikuti jalan dan rute yang tersedia. Cocok untuk instalasi yang mengikuti infrastruktur jalan.</p>
                                    <button class="btn btn-primary btn-block" onclick="startRoadRouting(${itemId})">
                                        <i class="fas fa-road"></i> Gunakan Routing Jalan
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card border-success h-100">
                                <div class="card-body text-center">
                                    <i class="fas fa-arrows-alt fa-3x text-success mb-3"></i>
                                    <h5 class="card-title">Garis Lurus</h5>
                                    <p class="card-text">Membuat jalur garis lurus langsung antar titik. Cocok untuk instalasi udara atau jalur khusus.</p>
                                    <button class="btn btn-success btn-block" onclick="startStraightLineRouting(${itemId})">
                                        <i class="fas fa-minus"></i> Gunakan Garis Lurus
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Create modal if doesn't exist
    if (!$('#routingTypeModal').length) {
        $('body').append(`
            <div class="modal fade" id="routingTypeModal" tabindex="-1" role="dialog">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4 class="modal-title">
                                <i class="fas fa-route"></i> Pilih Jenis Routing
                            </h4>
                            <button type="button" class="close" data-dismiss="modal">
                                <span>&times;</span>
                            </button>
                        </div>
                        <div class="modal-body" id="routingTypeModalBody">
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Batal</button>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }
    
    $('#routingTypeModalBody').html(modalHtml);
    $('#routingTypeModal').modal('show');
}

// Start road routing mode
function startRoadRouting(itemId) {
    isRoutingMode = true;
    routingFromItem = itemId;
    routingType = 'road'; // Set routing type
    map.getContainer().style.cursor = 'crosshair';
    $('#routingTypeModal').modal('hide');
    showNotification('Pilih item tujuan untuk membuat route mengikuti jalan', 'info');
}

// Start straight line routing mode
function startStraightLineRouting(itemId) {
    isRoutingMode = true;
    routingFromItem = itemId;
    routingType = 'straight'; // Set routing type
    map.getContainer().style.cursor = 'crosshair';
    $('#routingTypeModal').modal('hide');
    showNotification('Pilih item tujuan untuk membuat route garis lurus', 'info');
}

// Handle routing click
function handleRoutingClick(toItem) {
    if (routingFromItem && routingFromItem !== toItem.id) {
        createRoute(routingFromItem, toItem.id);
        exitRoutingMode();
    }
}

// Exit routing mode
function exitRoutingMode() {
    isRoutingMode = false;
    routingFromItem = null;
    routingType = 'road'; // Reset to default
    map.getContainer().style.cursor = '';
}

// Create route between two items
function createRoute(fromItemId, toItemId) {
    let fromMarker = markers[fromItemId];
    let toMarker = markers[toItemId];
    
    if (!fromMarker || !toMarker) {
        showNotification('Marker tidak ditemukan', 'error');
        return;
    }
    
    let fromPos = fromMarker.getLatLng();
    let toPos = toMarker.getLatLng();
    
    console.log('Creating route from', fromPos, 'to', toPos, 'using', routingType, 'routing');
    
    // If straight line routing is selected, create simple route directly
    if (routingType === 'straight') {
        createSimpleRoute(fromItemId, toItemId, fromPos, toPos);
        return;
    }
    
    // Check if Leaflet Routing Machine is available for road routing
    if (typeof L.Routing === 'undefined') {
        console.log('Leaflet Routing Machine not available, falling back to simple line');
        createSimpleRoute(fromItemId, toItemId, fromPos, toPos);
        return;
    }
    
    try {
        // Use routing machine to create route following roads
        let routing = L.Routing.control({
            waypoints: [fromPos, toPos],
            routeWhileDragging: false,
            show: false,
            createMarker: function() { return null; }, // Don't create default markers
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: false
        });
        
        routing.on('routesfound', function(e) {
            console.log('Route found:', e.routes[0]);
            let route = e.routes[0];
            let coordinates = route.coordinates;
            
            // Save route to database
            $.ajax({
                url: 'api/routes.php',
                method: 'POST',
                data: {
                    from_item_id: fromItemId,
                    to_item_id: toItemId,
                    route_coordinates: JSON.stringify(coordinates),
                    distance: route.summary.totalDistance,
                    cable_type: 'Fiber Optic',
                    core_count: 24,
                    status: 'planned'
                },
                success: function(response) {
                    console.log('Route save response:', response);
                    if (response.success) {
                        // Add route line to map
                        let routeLine = L.polyline(coordinates, {
                            color: '#ffc107',
                            weight: 4,
                            opacity: 0.8,
                            dashArray: '10, 5'
                        }).addTo(map);
                        
                        // Add popup to route
                        routeLine.bindPopup(`
                            <div>
                                <h6>Route Kabel</h6>
                                <p><strong>Jarak:</strong> ${(route.summary.totalDistance / 1000).toFixed(2)} km</p>
                                <p><strong>Tipe Kabel:</strong> Fiber Optic</p>
                                <p><strong>Jumlah Core:</strong> 24</p>
                                <p><strong>Status:</strong> Perencanaan</p>
                            </div>
                        `);
                        
                        routes[response.route_id] = routeLine;
                        showNotification('Route berhasil dibuat', 'success');
                        
                        // Remove routing control
                        map.removeControl(routing);
                    } else {
                        showNotification(response.message || 'Gagal menyimpan route', 'error');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Error saving route:', error);
                    showNotification('Error menyimpan route: ' + error, 'error');
                }
            });
        });
        
        routing.on('routingerror', function(e) {
            console.error('Routing error:', e.error);
            showNotification('Error routing: ' + e.error.message, 'error');
            // Fallback to simple line
            createSimpleRoute(fromItemId, toItemId, fromPos, toPos);
        });
        
        routing.addTo(map);
        
    } catch (error) {
        console.error('Error creating route:', error);
        showNotification('Error creating route, using simple line', 'warning');
        createSimpleRoute(fromItemId, toItemId, fromPos, toPos);
    }
}

// Create simple straight line route (fallback or intentional)
function createSimpleRoute(fromItemId, toItemId, fromPos, toPos) {
    let coordinates = [[fromPos.lat, fromPos.lng], [toPos.lat, toPos.lng]];
    let distance = fromPos.distanceTo(toPos);
    let isIntentionalStraight = routingType === 'straight';
    
    $.ajax({
        url: 'api/routes.php',
        method: 'POST',
        data: {
            from_item_id: fromItemId,
            to_item_id: toItemId,
            route_coordinates: JSON.stringify(coordinates),
            distance: distance,
            cable_type: 'Fiber Optic',
            core_count: 24,
            status: 'planned',
            route_type: isIntentionalStraight ? 'straight' : 'direct'
        },
        success: function(response) {
            if (response.success) {
                // Different styling for intentional straight line vs fallback
                let routeStyle = {
                    weight: 4,
                    opacity: 0.8
                };
                
                if (isIntentionalStraight) {
                    // Solid green line for intentional straight routing
                    routeStyle.color = '#28a745';
                    routeStyle.dashArray = null;
                } else {
                    // Dashed yellow line for fallback routing
                    routeStyle.color = '#ffc107';
                    routeStyle.dashArray = '10, 5';
                }
                
                let routeLine = L.polyline(coordinates, routeStyle).addTo(map);
                
                let routeTypeLabel = isIntentionalStraight ? 'Garis Lurus' : 'Direct (Fallback)';
                let routeDescription = isIntentionalStraight ? 
                    'Jalur garis lurus langsung antar titik' : 
                    'Jalur sederhana (routing jalan tidak tersedia)';
                
                routeLine.bindPopup(`
                    <div>
                        <h6>Route Kabel (${routeTypeLabel})</h6>
                        <p class="text-muted small">${routeDescription}</p>
                        <p><strong>Jarak:</strong> ${(distance / 1000).toFixed(2)} km</p>
                        <p><strong>Tipe Kabel:</strong> Fiber Optic</p>
                        <p><strong>Jumlah Core:</strong> 24</p>
                        <p><strong>Status:</strong> Perencanaan</p>
                    </div>
                `);
                
                routes[response.route_id] = routeLine;
                
                let successMessage = isIntentionalStraight ? 
                    'Route garis lurus berhasil dibuat' : 
                    'Route sederhana berhasil dibuat';
                showNotification(successMessage, 'success');
            }
        },
        error: function() {
            showNotification('Error menyimpan route', 'error');
        }
    });
}

// Load routes from database
function loadRoutes() {
    $.ajax({
        url: 'api/routes.php',
        method: 'GET',
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        },
        success: function(response) {
            if (response.success) {
                response.data.forEach(function(route) {
                    if (route.route_coordinates) {
                        let coordinates = JSON.parse(route.route_coordinates);
                        let color = getRouteColor(route.status);
                        let dashArray = route.status === 'installed' ? null : '10, 5';
                        
                        let routeLine = L.polyline(coordinates, {
                            color: color,
                            weight: 4,
                            opacity: 0.8,
                            dashArray: dashArray
                        }).addTo(map);
                        
                        routeLine.bindPopup(`
                            <div>
                                <h6>Route Kabel</h6>
                                <p><strong>Jarak:</strong> ${(route.distance / 1000).toFixed(2)} km</p>
                                <p><strong>Tipe Kabel:</strong> ${route.cable_type}</p>
                                <p><strong>Jumlah Core:</strong> ${route.core_count}</p>
                                <p><strong>Status:</strong> ${getStatusText(route.status)}</p>
                            </div>
                        `);
                        
                        routes[route.id] = routeLine;
                    }
                });
            } else {
                console.error('Load routes API error:', response.message);
            }
        },
        error: function(xhr, status, error) {
            console.error('Load routes AJAX error:', error, xhr.responseText);
            if (xhr.status === 401) {
                console.warn('Routes loading failed: Authentication required');
                // Don't show notification for routes as it's less critical than items
            }
        }
    });
}

// Get route color based on status
function getRouteColor(status) {
    switch(status) {
        case 'installed': return '#28a745';
        case 'planned': return '#ffc107';
        case 'maintenance': return '#dc3545';
        default: return '#6c757d';
    }
}

// Add map legend
function addMapLegend() {
    let legend = L.control({position: 'bottomleft'});
    
    legend.onAdd = function(map) {
        let div = L.DomUtil.create('div', 'map-legend');
        div.innerHTML = `
            <h6 style="margin-bottom: 10px; font-weight: bold;">Legend</h6>
            <div class="legend-item">
                <div class="legend-icon" style="background-color: #FF6B6B;"><i class="fas fa-server" style="color: white; font-size: 10px;"></i></div>
                <span>OLT</span>
            </div>
            <div class="legend-item">
                <div class="legend-icon" style="background-color: #4ECDC4;"><i class="fas fa-tower-broadcast" style="color: white; font-size: 10px;"></i></div>
                <span>Tiang Tumpu</span>
            </div>
            <div class="legend-item">
                <div class="legend-icon" style="background-color: #45B7D1;"><i class="fas fa-project-diagram" style="color: white; font-size: 10px;"></i></div>
                <span>Tiang ODP</span>
            </div>
            <div class="legend-item">
                <div class="legend-icon" style="background-color: #96CEB4;"><i class="fas fa-network-wired" style="color: white; font-size: 10px;"></i></div>
                <span>Tiang ODC</span>
            </div>
            <div class="legend-item">
                <div class="legend-icon" style="background-color: #8E44AD;"><i class="fas fa-server" style="color: white; font-size: 10px;"></i></div>
                <span>Server</span>
            </div>
            <div class="legend-item">
                <div class="legend-icon" style="background-color: #FFA500;"><i class="fas fa-home" style="color: white; font-size: 10px;"></i></div>
                <span>Pelanggan</span>
            </div>
            <hr style="margin: 10px 0;">
            <div style="font-size: 12px;">
                <div><span style="border-bottom: 3px solid #28a745; padding-bottom: 1px;">━━━</span> Terpasang</div>
                <div><span style="border-bottom: 3px dashed #ffc107; padding-bottom: 1px;">┅┅┅</span> Perencanaan</div>
                <div><span style="border-bottom: 3px dashed #dc3545; padding-bottom: 1px;">┅┅┅</span> Maintenance</div>
                <hr style="margin: 8px 0;">
                <div style="font-size: 11px; color: #666;">
                    <div><span style="border-bottom: 2px solid #28a745; padding-bottom: 1px;">━━</span> Garis Lurus</div>
                    <div><span style="border-bottom: 2px solid #007bff; padding-bottom: 1px;">━━</span> Routing Jalan</div>
                </div>
            </div>
        `;
        return div;
    };
    
    legend.addTo(map);
}

// Update statistics
function updateStatistics() {
    $.ajax({
        url: 'api/statistics.php',
        method: 'GET',
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        },
        success: function(response) {
            if (response.success) {
                $('#stat-olt').text(response.data.olt || 0);
                $('#stat-tiang').text(response.data.tiang_tumpu || 0);
                $('#stat-odp').text(response.data.odp || 0);
                $('#stat-odc').text(response.data.odc || 0);
                $('#stat-pelanggan').text(response.data.pelanggan || 0);
                $('#stat-routes').text(response.data.total_routes || 0);
            } else {
                console.error('Statistics API error:', response.message);
            }
        },
        error: function(xhr, status, error) {
            console.error('Statistics AJAX error:', error);
            if (xhr.status === 401) {
                console.warn('Statistics loading failed: Authentication required');
            }
        }
    });
}

// Show notification
function showNotification(message, type) {
    let alertClass = 'alert-info';
    switch(type) {
        case 'success': alertClass = 'alert-success'; break;
        case 'error': alertClass = 'alert-danger'; break;
        case 'warning': alertClass = 'alert-warning'; break;
    }
    
    let notification = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert" style="position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
            ${message}
            <button type="button" class="close" data-dismiss="alert">
                <span>&times;</span>
            </button>
        </div>
    `;
    
    $('body').append(notification);
    
    setTimeout(function() {
        $('.alert').fadeOut();
    }, 5000);
}

// Show routing mode
function showRoutingMode() {
    if (isRoutingMode) {
        exitRoutingMode();
        showNotification('Mode routing dinonaktifkan', 'info');
    } else {
        isRoutingMode = true;
        map.getContainer().style.cursor = 'crosshair';
        showNotification('Mode routing aktif. Klik dua item untuk membuat route.', 'info');
    }
}

// Zoom to specific bounds
function zoomToItems() {
    if (Object.keys(markers).length > 0) {
        const group = new L.featureGroup(Object.values(markers));
        map.fitBounds(group.getBounds().pad(0.1));
    } else {
        showNotification('Tidak ada item untuk di-zoom', 'warning');
    }
}

// Zoom to specific item type
function zoomToItemType(itemType) {
    const filteredMarkers = Object.values(markers).filter(marker => {
        return marker.options && marker.options.itemType === itemType;
    });
    
    if (filteredMarkers.length > 0) {
        const group = new L.featureGroup(filteredMarkers);
        map.fitBounds(group.getBounds().pad(0.1));
        
        // Highlight markers of this type temporarily
        filteredMarkers.forEach(marker => {
            if (marker._icon) {
                marker._icon.style.transform += ' scale(1.3)';
                marker._icon.style.zIndex = '1000';
                setTimeout(() => {
                    marker._icon.style.transform = marker._icon.style.transform.replace(' scale(1.3)', '');
                    marker._icon.style.zIndex = '';
                }, 2000);
            }
        });
        
        showNotification(`Menampilkan ${filteredMarkers.length} ${itemType}`, 'success');
    } else {
        showNotification(`Tidak ada ${itemType} ditemukan`, 'info');
    }
}

// Enhanced locate user function
function locateUser() {
    if (navigator.geolocation) {
        map.locate({
            setView: true,
            maxZoom: 16,
            enableHighAccuracy: true,
            timeout: 10000
        });
        
        map.on('locationfound', function(e) {
            L.circle(e.latlng, e.accuracy).addTo(map)
                .bindPopup('Anda berada di sekitar area ini').openPopup();
            showNotification('Lokasi berhasil ditemukan', 'success');
        });
        
        map.on('locationerror', function(e) {
            showNotification('Gagal menemukan lokasi: ' + e.message, 'error');
        });
    } else {
        showNotification('Geolocation tidak didukung browser ini', 'error');
    }
}

// Add keyboard shortcuts for zoom
function addKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') {
            return; // Don't interfere with form inputs
        }
        
        switch(e.key) {
            case '+':
            case '=':
                map.zoomIn();
                break;
            case '-':
                map.zoomOut();
                break;
            case 'h':
            case 'H':
                map.setView([-2.5, 118], 5); // Home to Indonesia
                break;
            case 'f':
            case 'F':
                if (map.isFullscreen && map.isFullscreen()) {
                    map.toggleFullscreen();
                } else if (map.toggleFullscreen) {
                    map.toggleFullscreen();
                }
                break;
            case 'l':
            case 'L':
                locateUser();
                break;
            case 'a':
            case 'A':
                zoomToItems();
                break;
        }
    });
}

// Enhanced map ready function
function onMapReady() {
    addKeyboardShortcuts();
    
    // Add help tooltip
    const helpControl = L.control({position: 'bottomright'});
    helpControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'leaflet-control-help');
        div.innerHTML = '<i class="fas fa-question-circle" title="Shortcuts: +/- zoom, H home, F fullscreen, L locate, A zoom to all"></i>';
        div.style.background = 'rgba(255,255,255,0.8)';
        div.style.padding = '5px';
        div.style.borderRadius = '3px';
        div.style.cursor = 'help';
        return div;
    };
    helpControl.addTo(map);
    
    console.log('🎮 Map keyboard shortcuts enabled: +/- zoom, H home, F fullscreen, L locate, A zoom to all');
}

// Helper functions needed by detail modal
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

function getStatusBadgeClass(status) {
    switch(status) {
        case 'active': return 'success';
        case 'inactive': return 'secondary';
        case 'maintenance': return 'warning';
        default: return 'secondary';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'active': return 'Aktif';
        case 'inactive': return 'Tidak Aktif';
        case 'maintenance': return 'Maintenance';
        default: return status || 'Unknown';
    }
}

// Export functions to global scope for button access
window.zoomToItems = zoomToItems;
window.zoomToItemType = zoomToItemType;
window.locateUser = locateUser;
window.loadRoutes = loadRoutes;
window.getItemIcon = getItemIcon;
window.getStatusBadgeClass = getStatusBadgeClass;
window.getStatusText = getStatusText;
window.startRouting = startRouting;
window.startRoadRouting = startRoadRouting;
window.startStraightLineRouting = startStraightLineRouting;

// Initialize map when document is ready
$(document).ready(function() {
    initMap();
    setTimeout(onMapReady, 1000); // Wait for map to fully initialize
});