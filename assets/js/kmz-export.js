// KMZ Export functionality for FTTH Planner

// Main export function
function exportToKMZ() {
    showNotification('Menggenerate KMZ file...', 'info');
    
    // Get all items and routes data
    Promise.all([
        fetchAllItems(),
        fetchAllRoutes()
    ]).then(function(results) {
        let items = results[0];
        let routes = results[1];
        
        // Validate data
        if (!items || items.length === 0) {
            showNotification('Tidak ada data item untuk diekspor', 'warning');
            return;
        }
        
        // Filter items with valid coordinates
        let validItems = items.filter(function(item) {
            let lat = parseFloat(item.latitude);
            let lng = parseFloat(item.longitude);
            return !isNaN(lat) && !isNaN(lng);
        });
        
        if (validItems.length === 0) {
            showNotification('Tidak ada item dengan koordinat yang valid untuk diekspor', 'warning');
            return;
        }
        
        if (validItems.length < items.length) {
            let skipped = items.length - validItems.length;
            showNotification(`${skipped} item dilewati karena koordinat tidak valid`, 'warning');
        }
        
        // Generate KML content
        let kmlContent = generateKML(validItems, routes);
        
        // Create KMZ file and download
        createKMZFile(kmlContent);
        
    }).catch(function(error) {
        console.error('Error exporting KMZ:', error);
        showNotification('Error menggenerate KMZ: ' + error.message, 'error');
    });
}

// Fetch all items from API
function fetchAllItems() {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: 'api/items.php',
            method: 'GET',
            success: function(response) {
                if (response.success) {
                    resolve(response.data);
                } else {
                    reject(new Error(response.message || 'Failed to fetch items'));
                }
            },
            error: function(xhr, status, error) {
                reject(new Error('API error: ' + error));
            }
        });
    });
}

// Fetch all routes from API
function fetchAllRoutes() {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: 'api/routes.php',
            method: 'GET',
            success: function(response) {
                if (response.success) {
                    resolve(response.data);
                } else {
                    reject(new Error(response.message || 'Failed to fetch routes'));
                }
            },
            error: function(xhr, status, error) {
                reject(new Error('API error: ' + error));
            }
        });
    });
}

// Generate KML content
function generateKML(items, routes) {
    let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
    <Document>
        <name>FTTH Planner Export</name>
        <description>Export data infrastruktur FTTH dari FTTH Planner</description>
        
        ${generateStyles()}
        ${generateItemPlacemarks(items)}
        ${generateRoutePlacemarks(routes)}
        
    </Document>
</kml>`;

    return kml;
}

// Generate KML styles for different item types
function generateStyles() {
    return `
        <!-- Styles for OLT -->
        <Style id="olt-style">
            <IconStyle>
                <Icon>
                    <href>http://maps.google.com/mapfiles/kml/paddle/red-circle.png</href>
                </Icon>
                <scale>1.2</scale>
            </IconStyle>
            <LabelStyle>
                <color>ffffffff</color>
                <scale>0.8</scale>
            </LabelStyle>
        </Style>
        
        <!-- Styles for Tiang Tumpu -->
        <Style id="tiang-style">
            <IconStyle>
                <Icon>
                    <href>http://maps.google.com/mapfiles/kml/paddle/grn-circle.png</href>
                </Icon>
                <scale>1.0</scale>
            </IconStyle>
            <LabelStyle>
                <color>ffffffff</color>
                <scale>0.8</scale>
            </LabelStyle>
        </Style>
        
        <!-- Styles for ODP -->
        <Style id="odp-style">
            <IconStyle>
                <Icon>
                    <href>http://maps.google.com/mapfiles/kml/paddle/blu-circle.png</href>
                </Icon>
                <scale>1.0</scale>
            </IconStyle>
            <LabelStyle>
                <color>ffffffff</color>
                <scale>0.8</scale>
            </LabelStyle>
        </Style>
        
        <!-- Styles for ODC -->
        <Style id="odc-style">
            <IconStyle>
                <Icon>
                    <href>http://maps.google.com/mapfiles/kml/paddle/grn-square.png</href>
                </Icon>
                <scale>1.0</scale>
            </IconStyle>
            <LabelStyle>
                <color>ffffffff</color>
                <scale>0.8</scale>
            </LabelStyle>
        </Style>
        
        <!-- Styles for Server -->
        <Style id="server-style">
            <IconStyle>
                <Icon>
                    <href>http://maps.google.com/mapfiles/kml/paddle/purple-square.png</href>
                </Icon>
                <scale>1.0</scale>
            </IconStyle>
            <LabelStyle>
                <color>ffffffff</color>
                <scale>0.8</scale>
            </LabelStyle>
        </Style>
        
        <!-- Styles for Pelanggan -->
        <Style id="pelanggan-style">
            <IconStyle>
                <Icon>
                    <href>http://maps.google.com/mapfiles/kml/paddle/orange-circle.png</href>
                </Icon>
                <scale>0.8</scale>
            </IconStyle>
            <LabelStyle>
                <color>ffffffff</color>
                <scale>0.8</scale>
            </LabelStyle>
        </Style>
        
        <!-- Styles for Routes -->
        <Style id="route-planned">
            <LineStyle>
                <color>ff00ffff</color>
                <width>3</width>
            </LineStyle>
        </Style>
        
        <Style id="route-installed">
            <LineStyle>
                <color>ff00ff00</color>
                <width>4</width>
            </LineStyle>
        </Style>
        
        <Style id="route-maintenance">
            <LineStyle>
                <color>ff0000ff</color>
                <width>3</width>
            </LineStyle>
        </Style>
    `;
}

// Generate placemarks for items
function generateItemPlacemarks(items) {
    let placemarks = '';
    
    items.forEach(function(item) {
        // Validate coordinates
        let lat = parseFloat(item.latitude);
        let lng = parseFloat(item.longitude);
        
        if (isNaN(lat) || isNaN(lng)) {
            console.warn('Invalid coordinates for item:', item.name, 'lat:', item.latitude, 'lng:', item.longitude);
            return; // Skip this item
        }
        
        let styleId = getStyleId(item.item_type_name);
        let description = generateItemDescription(item);
        
        placemarks += `
        <Placemark>
            <name>${escapeXML(item.name)}</name>
            <description><![CDATA[${description}]]></description>
            <styleUrl>#${styleId}</styleUrl>
            <Point>
                <coordinates>${lng},${lat},0</coordinates>
            </Point>
        </Placemark>`;
    });
    
    return placemarks;
}

// Generate placemarks for routes
function generateRoutePlacemarks(routes) {
    let placemarks = '';
    
    routes.forEach(function(route) {
        if (route.route_coordinates) {
            let coordinates = '';
            try {
                let coordArray = JSON.parse(route.route_coordinates);
                coordinates = coordArray.map(coord => `${coord.lng || coord[1]},${coord.lat || coord[0]},0`).join(' ');
            } catch (e) {
                console.warn('Invalid route coordinates for route', route.id);
                return;
            }
            
            let styleId = 'route-' + route.status;
            let description = generateRouteDescription(route);
            
            placemarks += `
        <Placemark>
            <name>Route: ${escapeXML(route.from_item_name)} → ${escapeXML(route.to_item_name)}</name>
            <description><![CDATA[${description}]]></description>
            <styleUrl>#${styleId}</styleUrl>
            <LineString>
                <tessellate>1</tessellate>
                <coordinates>${coordinates}</coordinates>
            </LineString>
        </Placemark>`;
        }
    });
    
    return placemarks;
}

// Get style ID based on item type
function getStyleId(itemType) {
    switch(itemType) {
        case 'OLT': return 'olt-style';
        case 'Tiang Tumpu': return 'tiang-style';
        case 'Tiang ODP':
        case 'ODP': return 'odp-style';
        case 'Tiang ODC':
        case 'ODC': return 'odc-style';
        case 'Server': return 'server-style';
        case 'Pelanggan': return 'pelanggan-style';
        default: return 'odp-style';
    }
}

// Generate item description HTML
function generateItemDescription(item) {
    let description = `
        <table border="1" cellpadding="5">
            <tr><td><b>Jenis:</b></td><td>${item.item_type_name}</td></tr>
            <tr><td><b>Nama:</b></td><td>${escapeXML(item.name)}</td></tr>`;
    
    if (item.description) {
        description += `<tr><td><b>Deskripsi:</b></td><td>${escapeXML(item.description)}</td></tr>`;
    }
    
    if (item.address) {
        description += `<tr><td><b>Alamat:</b></td><td>${escapeXML(item.address)}</td></tr>`;
    }
    
    // Handle coordinates safely
    let lat = parseFloat(item.latitude);
    let lng = parseFloat(item.longitude);
    let coordText = (isNaN(lat) || isNaN(lng)) ? 'Koordinat tidak valid' : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    description += `<tr><td><b>Koordinat:</b></td><td>${coordText}</td></tr>`;
    
    if (item.tube_color_name) {
        description += `<tr><td><b>Warna Tube:</b></td><td>${item.tube_color_name}</td></tr>`;
    }
    
    if (item.core_used) {
        description += `<tr><td><b>Core Digunakan:</b></td><td>${item.core_used}</td></tr>`;
    }
    
    if (item.splitter_main_ratio) {
        description += `<tr><td><b>Splitter Utama:</b></td><td>${item.splitter_main_ratio}</td></tr>`;
    }
    
    if (item.splitter_odp_ratio) {
        description += `<tr><td><b>Splitter ODP:</b></td><td>${item.splitter_odp_ratio}</td></tr>`;
    }
    
    description += `<tr><td><b>Status:</b></td><td>${getStatusText(item.status)}</td></tr>`;
    description += `</table>`;
    
    return description;
}

// Generate route description HTML
function generateRouteDescription(route) {
    let distance = route.distance ? parseFloat(route.distance).toFixed(2) + ' m' : 'Unknown';
    
    return `
        <table border="1" cellpadding="5">
            <tr><td><b>Dari:</b></td><td>${escapeXML(route.from_item_name || 'Unknown')}</td></tr>
            <tr><td><b>Ke:</b></td><td>${escapeXML(route.to_item_name || 'Unknown')}</td></tr>
            <tr><td><b>Jarak:</b></td><td>${distance}</td></tr>
            <tr><td><b>Tipe Kabel:</b></td><td>${escapeXML(route.cable_type || 'Fiber Optic')}</td></tr>
            <tr><td><b>Jumlah Core:</b></td><td>${route.core_count || 24}</td></tr>
            <tr><td><b>Status:</b></td><td>${getStatusText(route.status)}</td></tr>
        </table>
    `;
}

// Escape XML special characters
function escapeXML(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Get status text in Indonesian
function getStatusText(status) {
    switch(status) {
        case 'active': return 'Aktif';
        case 'inactive': return 'Tidak Aktif'; 
        case 'maintenance': return 'Maintenance';
        case 'planned': return 'Perencanaan';
        case 'installed': return 'Terpasang';
        default: return status || 'Unknown';
    }
}

// Create KMZ file and trigger download
function createKMZFile(kmlContent) {
    try {
        // Create ZIP file containing the KML
        let zip = new JSZip();
        zip.file("doc.kml", kmlContent);
        
        // Generate KMZ file
        zip.generateAsync({type:"blob"}).then(function(content) {
            // Create filename with timestamp
            let timestamp = new Date().toISOString().slice(0,19).replace(/:/g,'-');
            let filename = `FTTH_Planner_Export_${timestamp}.kmz`;
            
            // Save file
            saveAs(content, filename);
            showNotification(`KMZ file berhasil diunduh: ${filename}`, 'success');
        }).catch(function(error) {
            console.error('Error creating KMZ:', error);
            showNotification('Error membuat file KMZ: ' + error.message, 'error');
        });
        
    } catch (error) {
        console.error('Error in createKMZFile:', error);
        showNotification('Error membuat KMZ file: ' + error.message, 'error');
    }
}

// Add export button to global scope
window.exportToKMZ = exportToKMZ;