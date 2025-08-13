// KMZ Import functionality for FTTH Planner

// Global variable to track preview state
let isPreviewSuccessful = false;

// Show import KMZ modal
function showImportKMZModal() {
    // Reset preview state
    isPreviewSuccessful = false;
    
    let modalHtml = `
        <div class="row">
            <div class="col-md-12">
                <div class="import-instructions mb-4">
                    <h6><i class="fas fa-info-circle text-info"></i> Panduan Import KMZ</h6>
                    <ul class="small text-muted">
                        <li>File harus berformat <strong>.kmz</strong> atau <strong>.kml</strong></li>
                        <li>Maksimal ukuran file: <strong>10MB</strong></li>
                        <li>Data yang dapat diimport: titik lokasi (placemarks) dengan koordinat</li>
                        <li>Item akan ditambahkan sebagai "Pelanggan" secara default</li>
                    </ul>
                </div>
                
                <form id="importKMZForm" enctype="multipart/form-data">
                    <div class="form-group">
                        <label for="kmzFile">Pilih File KMZ/KML</label>
                        <div class="custom-file">
                            <input type="file" class="custom-file-input" id="kmzFile" name="kmzFile" accept=".kmz,.kml" required>
                            <label class="custom-file-label" for="kmzFile">Pilih file...</label>
                        </div>
                        <small class="form-text text-muted">Format yang didukung: .kmz, .kml (max 10MB)</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="defaultItemType">Jenis Item Default</label>
                        <select class="form-control" id="defaultItemType" name="defaultItemType">
                            <option value="5">Pelanggan</option>
                            <option value="1">OLT</option>
                            <option value="2">Tiang Tumpu</option>
                            <option value="3">Tiang ODP</option>
                            <option value="4">Tiang ODC</option>
                            <option value="6">Server</option>
                        </select>
                        <small class="form-text text-muted">Semua item yang diimport akan memiliki jenis ini</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="importPrefix">Prefix Nama (opsional)</label>
                        <input type="text" class="form-control" id="importPrefix" name="importPrefix" placeholder="Contoh: Import_2024_">
                        <small class="form-text text-muted">Akan ditambahkan di depan nama setiap item</small>
                    </div>
                    
                    <div class="form-check mb-3">
                        <input type="checkbox" class="form-check-input" id="replaceExisting" name="replaceExisting">
                        <label class="form-check-label" for="replaceExisting">
                            Ganti item yang sudah ada (berdasarkan nama)
                        </label>
                        <small class="form-text text-muted">Jika dicentang, item dengan nama sama akan diganti</small>
                    </div>
                    
                    <div class="progress mb-3" style="display: none;" id="importProgress">
                        <div class="progress-bar" role="progressbar" style="width: 0%"></div>
                    </div>
                    
                    <div id="importPreview" style="display: none;">
                        <h6>Preview Data:</h6>
                        <div id="previewContent" class="border p-2 mb-3" style="max-height: 200px; overflow-y: auto;"></div>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Create modal if doesn't exist
    if (!$('#importKMZModal').length) {
        $('body').append(`
            <div class="modal fade" id="importKMZModal" tabindex="-1" role="dialog">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4 class="modal-title">
                                <i class="fas fa-upload"></i> Import Data KMZ/KML
                            </h4>
                            <button type="button" class="close" data-dismiss="modal">
                                <span>&times;</span>
                            </button>
                        </div>
                        <div class="modal-body" id="importKMZModalBody">
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Batal</button>
                            <button type="button" class="btn btn-info" onclick="previewKMZFile()" id="previewBtn">
                                <i class="fas fa-eye"></i> Preview
                            </button>
                            <button type="button" class="btn btn-warning" onclick="importKMZFile()" id="importBtn" disabled title="Pilih file terlebih dahulu">
                                <i class="fas fa-upload"></i> Import
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }
    
    $('#importKMZModalBody').html(modalHtml);
    $('#importKMZModal').modal('show');
    
    // Handle file input change
    $('#kmzFile').on('change', function() {
        let fileName = $(this).val().split('\\').pop();
        const file = this.files[0];
        
        $('.custom-file-label').text(fileName);
        $('#previewBtn').prop('disabled', !fileName);
        $('#importPreview').hide();
        
        // Reset preview state when file changes
        isPreviewSuccessful = false;
        
        // Enable import button if file is selected and valid
        if (file && fileName) {
            console.log('File selected:', fileName, 'Size:', (file.size / 1024).toFixed(2) + 'KB');
            
            // Check file size (10MB limit)
            if (file.size <= 10 * 1024 * 1024) {
                // Check file extension
                const validExtensions = ['.kmz', '.kml'];
                const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
                
                if (validExtensions.includes(fileExtension)) {
                    $('#importBtn').prop('disabled', false).attr('title', 'Klik untuk import file');
                    console.log('✅ Import button ENABLED - Valid file selected');
                } else {
                    $('#importBtn').prop('disabled', true).attr('title', 'Format file tidak didukung');
                    console.log('❌ Import button DISABLED - Invalid file extension:', fileExtension);
                }
            } else {
                $('#importBtn').prop('disabled', true).attr('title', 'Ukuran file terlalu besar (max 10MB)');
                console.log('❌ Import button DISABLED - File too large:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
            }
        } else {
            $('#importBtn').prop('disabled', true).attr('title', 'Pilih file terlebih dahulu');
            console.log('❌ Import button DISABLED - No file selected');
        }
    });
}

// Preview KMZ file content
function previewKMZFile() {
    const fileInput = document.getElementById('kmzFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showNotification('Pilih file KMZ/KML terlebih dahulu', 'warning');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        showNotification('Ukuran file terlalu besar (maksimal 10MB)', 'error');
        return;
    }
    
    // Check if JSZip is loaded
    if (typeof JSZip === 'undefined') {
        showNotification('Library JSZip tidak dimuat. Refresh halaman dan coba lagi.', 'error');
        resetImportButtons();
        return;
    }
    
    $('#previewBtn').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Processing...');
    
    if (file.name.toLowerCase().endsWith('.kmz')) {
        parseKMZFile(file, true);
    } else if (file.name.toLowerCase().endsWith('.kml')) {
        parseKMLFile(file, true);
    } else {
        showNotification('Format file tidak didukung. Gunakan .kmz atau .kml', 'error');
        $('#previewBtn').prop('disabled', false).html('<i class="fas fa-eye"></i> Preview');
    }
}

// Import KMZ file
function importKMZFile() {
    console.log('🚀 importKMZFile() called');
    
    const fileInput = document.getElementById('kmzFile');
    const file = fileInput.files[0];
    
    console.log('File input element:', fileInput);
    console.log('Selected file:', file);
    
    if (!file) {
        console.log('❌ No file selected');
        showNotification('Pilih file KMZ/KML terlebih dahulu', 'warning');
        return;
    }
    
    // Preview is optional, user can import directly
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        showNotification('Ukuran file terlalu besar (maksimal 10MB)', 'error');
        return;
    }
    
    // Check if JSZip is loaded
    if (typeof JSZip === 'undefined') {
        showNotification('Library JSZip tidak dimuat. Refresh halaman dan coba lagi.', 'error');
        resetImportButtons();
        return;
    }
    
    $('#importBtn').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Importing...');
    $('#importProgress').show();
    
    if (file.name.toLowerCase().endsWith('.kmz')) {
        parseKMZFile(file, false);
    } else if (file.name.toLowerCase().endsWith('.kml')) {
        parseKMLFile(file, false);
    } else {
        showNotification('Format file tidak didukung. Gunakan .kmz atau .kml', 'error');
        resetImportButtons();
    }
}

// Parse KMZ file (compressed KML)
function parseKMZFile(file, isPreview) {
    JSZip.loadAsync(file).then(function(zip) {
        // Look for KML file inside ZIP
        let kmlFile = null;
        zip.forEach(function(relativePath, zipEntry) {
            if (zipEntry.name.toLowerCase().endsWith('.kml')) {
                kmlFile = zipEntry;
            }
        });
        
        if (!kmlFile) {
            throw new Error('Tidak ditemukan file KML di dalam KMZ');
        }
        
        return kmlFile.async('text');
    }).then(function(kmlContent) {
        parseKMLContent(kmlContent, isPreview);
    }).catch(function(error) {
        console.error('Error parsing KMZ:', error);
        showNotification('Error membaca file KMZ: ' + error.message, 'error');
        resetImportButtons();
    });
}

// Parse KML file
function parseKMLFile(file, isPreview) {
    const reader = new FileReader();
    reader.onload = function(e) {
        parseKMLContent(e.target.result, isPreview);
    };
    reader.onerror = function() {
        showNotification('Error membaca file KML', 'error');
        resetImportButtons();
    };
    reader.readAsText(file);
}

// Parse KML content
function parseKMLContent(kmlContent, isPreview) {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(kmlContent, 'application/xml');
        
        // Check for parsing errors
        if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
            throw new Error('Format KML tidak valid');
        }
        
        // Extract placemarks
        const placemarks = xmlDoc.getElementsByTagName('Placemark');
        const items = [];
        
        for (let i = 0; i < placemarks.length; i++) {
            const placemark = placemarks[i];
            const item = extractPlacemarkData(placemark);
            if (item) {
                items.push(item);
            }
        }
        
        console.log(`📊 Extracted ${items.length} valid items from KML`);
        
        if (items.length === 0) {
            console.error('❌ No valid items found in KML');
            console.log('Total placemarks found:', placemarks.length);
            
            // Log sample placemark for debugging
            if (placemarks.length > 0) {
                console.log('Sample placemark XML:', placemarks[0].outerHTML);
            }
            
            throw new Error('Tidak ditemukan data placemark dengan koordinat valid');
        }
        
        if (isPreview) {
            showPreview(items);
        } else {
            processImportData(items);
        }
        
    } catch (error) {
        console.error('Error parsing KML content:', error);
        showNotification('Error parsing KML: ' + error.message, 'error');
        resetImportButtons();
    }
}

// Extract data from a placemark element
function extractPlacemarkData(placemark) {
    const nameElement = placemark.getElementsByTagName('name')[0];
    const descElement = placemark.getElementsByTagName('description')[0];
    const pointElement = placemark.getElementsByTagName('Point')[0];
    
    if (!pointElement) {
        // Try MultiGeometry for Google Earth exports
        const multiGeometry = placemark.getElementsByTagName('MultiGeometry')[0];
        if (multiGeometry) {
            const point = multiGeometry.getElementsByTagName('Point')[0];
            if (point) {
                const coordsElement = point.getElementsByTagName('coordinates')[0];
                if (coordsElement) {
                    return parseCoordinates(nameElement, descElement, coordsElement);
                }
            }
        }
        
        // Try Polygon or LineString (get first coordinate)
        const polygon = placemark.getElementsByTagName('Polygon')[0];
        if (polygon) {
            const coordinates = polygon.getElementsByTagName('coordinates')[0];
            if (coordinates) {
                // Get first coordinate from polygon/linestring
                const coordText = coordinates.textContent.trim();
                const firstCoord = coordText.split(/\s+/)[0];
                if (firstCoord) {
                    const tempCoords = document.createElement('coordinates');
                    tempCoords.textContent = firstCoord;
                    return parseCoordinates(nameElement, descElement, tempCoords);
                }
            }
        }
        
        const lineString = placemark.getElementsByTagName('LineString')[0];
        if (lineString) {
            const coordinates = lineString.getElementsByTagName('coordinates')[0];
            if (coordinates) {
                // Get first coordinate from linestring
                const coordText = coordinates.textContent.trim();
                const firstCoord = coordText.split(/\s+/)[0];
                if (firstCoord) {
                    const tempCoords = document.createElement('coordinates');
                    tempCoords.textContent = firstCoord;
                    return parseCoordinates(nameElement, descElement, tempCoords);
                }
            }
        }
        
        // Skip this placemark if no recognizable geometry
        return null;
    }
    
    const coordsElement = pointElement.getElementsByTagName('coordinates')[0];
    if (!coordsElement) return null;
    
    return parseCoordinates(nameElement, descElement, coordsElement);
}

// Helper function to parse coordinates
function parseCoordinates(nameElement, descElement, coordsElement) {
    const coords = coordsElement.textContent.trim().split(/[\s,]+/);
    if (coords.length < 2) return null;
    
    const lng = parseFloat(coords[0]);
    const lat = parseFloat(coords[1]);
    
    if (isNaN(lat) || isNaN(lng)) return null;
    
    // Validate coordinate ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.warn('Invalid coordinates:', lat, lng);
        return null;
    }
    
    return {
        name: nameElement ? nameElement.textContent.trim() : 'Unnamed',
        description: descElement ? descElement.textContent.trim() : '',
        latitude: lat,
        longitude: lng
    };
}

// Show preview of imported data
function showPreview(items) {
    let previewHtml = `
        <div class="alert alert-success">
            <i class="fas fa-check-circle"></i> Ditemukan <strong>${items.length}</strong> item yang dapat diimport
        </div>
        <div class="table-responsive">
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>Nama</th>
                        <th>Koordinat</th>
                        <th>Deskripsi</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    items.slice(0, 10).forEach(function(item) {
        previewHtml += `
            <tr>
                <td>${escapeHtml(item.name)}</td>
                <td>${item.latitude.toFixed(6)}, ${item.longitude.toFixed(6)}</td>
                <td>${escapeHtml(item.description.substring(0, 50))}${item.description.length > 50 ? '...' : ''}</td>
            </tr>
        `;
    });
    
    if (items.length > 10) {
        previewHtml += `
            <tr>
                <td colspan="3" class="text-center text-muted">
                    <i>... dan ${items.length - 10} item lainnya</i>
                </td>
            </tr>
        `;
    }
    
    previewHtml += `
                </tbody>
            </table>
        </div>
    `;
    
    $('#previewContent').html(previewHtml);
    $('#importPreview').show();
    
    // Mark preview as successful and enable import button
    isPreviewSuccessful = true;
    $('#importBtn').prop('disabled', false).html('<i class="fas fa-upload"></i> Import');
    
    // Reset only preview button
    $('#previewBtn').prop('disabled', false).html('<i class="fas fa-eye"></i> Preview');
}

// Process and import data
function processImportData(items) {
    const defaultItemType = $('#defaultItemType').val();
    const importPrefix = $('#importPrefix').val() || '';
    const replaceExisting = $('#replaceExisting').is(':checked');
    
    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let totalItems = items.length;
    
    // Show progress bar animation
    $('#importProgress .progress-bar').css('width', '10%').text('10%');
    
    // Use batch import API
    function processBatchImport() {
        const batchData = {
            batch_import: 'true',
            items: JSON.stringify(items),
            default_item_type: defaultItemType,
            import_prefix: importPrefix,
            replace_existing: replaceExisting ? 'true' : 'false'
        };

        $.ajax({
            url: 'api/import.php',
            method: 'POST',
            data: batchData,
            dataType: 'json',
            success: function(response) {
                $('#importProgress').hide();
                $('#importKMZModal').modal('hide');
                
                if (response.success) {
                    const data = response.data;
                    let message = `Import selesai: ${data.imported} berhasil`;
                    if (data.errors > 0) message += `, ${data.errors} error`;
                    
                    showNotification(message, data.imported > 0 ? 'success' : 'warning');
                    
                    // Log error details if any
                    if (data.error_details && data.error_details.length > 0) {
                        console.warn('Import errors:', data.error_details);
                    }
                } else {
                    showNotification('Import gagal: ' + response.message, 'error');
                }
                
                if (typeof loadItems === 'function') {
                    loadItems(); // Refresh the map
                }
            },
            error: function(xhr, status, error) {
                $('#importProgress').hide();
                console.error('Batch import error:', error);
                console.error('Response status:', xhr.status);
                console.error('Response text:', xhr.responseText);
                
                // Try to parse error response
                let errorMessage = 'Error saat import: ' + error;
                if (xhr.responseText) {
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        if (errorResponse.message) {
                            errorMessage = 'Import gagal: ' + errorResponse.message;
                        }
                    } catch (parseError) {
                        // If response is not JSON, show first 200 chars
                        const responsePreview = xhr.responseText.substring(0, 200);
                        errorMessage = 'Server error: ' + responsePreview;
                        console.error('Non-JSON response:', xhr.responseText);
                    }
                }
                
                showNotification(errorMessage, 'error');
                resetImportButtons();
            }
        });
    }
    
    // Start batch import
    processBatchImport();
}

// Reset import buttons
function resetImportButtons() {
    $('#previewBtn').prop('disabled', false).html('<i class="fas fa-eye"></i> Preview');
    $('#importBtn').prop('disabled', true).html('<i class="fas fa-upload"></i> Import');
}

// Reset import buttons but keep import enabled (after successful preview)
function resetImportButtonsKeepEnabled() {
    $('#previewBtn').prop('disabled', false).html('<i class="fas fa-eye"></i> Preview');
    $('#importBtn').prop('disabled', false).html('<i class="fas fa-upload"></i> Import');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Debug function to check import button state
function debugImportState() {
    console.log('=== Import State Debug ===');
    console.log('isPreviewSuccessful:', isPreviewSuccessful);
    console.log('importBtn disabled:', $('#importBtn').prop('disabled'));
    console.log('file selected:', $('#kmzFile').val());
    console.log('preview visible:', $('#importPreview').is(':visible'));
    console.log('========================');
}

// Export functions to global scope
window.showImportKMZModal = showImportKMZModal;
window.previewKMZFile = previewKMZFile;
window.importKMZFile = importKMZFile;
window.debugImportState = debugImportState;