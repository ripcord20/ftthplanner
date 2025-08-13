# 🌐 FTTH Planner - Complete Infrastructure Planning Solution

Aplikasi perencanaan infrastruktur FTTH (Fiber to the Home) berbasis web menggunakan AdminLTE, PHP, MySQL, dan OpenStreetMaps dengan sistem authentication dan manajemen user.

## 🚀 Fitur Utama

### 📍 **Manajemen Item FTTH Lengkap**
- **7 Kategori Item**: OLT, Tiang Tumpu, Tiang ODP, Tiang ODC, **Tiang Joint Closure** ⭐ **BARU**, Pelanggan, Server
- **Peta Interaktif**: Visualisasi infrastruktur menggunakan OpenStreetMaps multi-layer
- **Drag & Drop**: Pindahkan item langsung di peta dengan real-time update
- **Routing Kabel**: Buat rute kabel mengikuti jalan dengan perhitungan jarak meter ⭐ **UPDATED**
- **Multiple Delete**: Bulk operations untuk menghapus item dan route secara bersamaan ⭐ **BARU**

### 🔐 **Authentication & User Management** ⭐ **BARU**
- **Login System**: Secure authentication dengan session management
- **Role-Based Access**: Admin (full CRUD) dan Teknisi (read-only)
- **User Management**: Kelola user accounts (admin only)
- **Session Security**: Auto-logout dan protection untuk semua API endpoints

### 📊 **Dashboard & Monitoring**
- **Dashboard Statistik**: Real-time monitoring jumlah item dan route
- **Responsive Design**: Tampilan optimal di desktop dan mobile
- **Export/Import KMZ**: Bidirectional Google Earth integration

### 🎨 **Advanced Features**
- **32 Pilihan Warna Tube**: Manajemen warna core dan tube terpisah
- **Smart Route Calculation**: Auto-routing mengikuti jalan existing
- **Professional Export**: KMZ format dengan styling untuk Google Earth

## 💻 Sistem Requirement

### 🖥️ **Windows Development Environment**
- **OS**: Windows 7/8/10/11 (32-bit & 64-bit)
- **XAMPP**: Apache, MySQL, PHP 8.0+ (Recommended PHP 8.1+)
- **RAM**: Minimum 4GB (Recommended 8GB)
- **Storage**: 500MB free space
- **Browser**: Chrome, Firefox, Edge, Safari (modern browsers)
- **Internet**: Required untuk loading maps dan library

### ☁️ **Production VPS Requirements (Ubuntu Server)**
- **OS**: Ubuntu 18.04/20.04/22.04 LTS
- **RAM**: Minimum 1GB (Recommended 2GB+)
- **Storage**: 5GB free space
- **Software**: Apache/Nginx, MySQL 8.0, PHP 8.0+
- **Network**: Public IP dengan domain/subdomain

---

# 🛠️ PANDUAN INSTALASI LENGKAP

## 📦 Option 1: Windows Development dengan XAMPP

### **Step 1: Download & Install XAMPP**

1. **Download XAMPP** dari [https://www.apachefriends.org/](https://www.apachefriends.org/)
   - Pilih versi PHP 8.0+ untuk performa optimal
   - Download installer untuk Windows

2. **Install XAMPP**
   ```
   - Jalankan installer sebagai Administrator
   - Pilih komponen: Apache, MySQL, PHP, phpMyAdmin
   - Install di C:\xampp (default recommended)
   - Allow firewall access untuk Apache dan MySQL
   ```

3. **Start Services**
   ```
   - Buka XAMPP Control Panel
   - Klik "Start" untuk Apache
   - Klik "Start" untuk MySQL
   - Pastikan status "Running" berwarna hijau
   ```

### **Step 2: Setup Database**

#### **Method A: Via phpMyAdmin (Recommended)**
1. **Buka phpMyAdmin**: `http://localhost/phpmyadmin`
2. **Import Database**:
   - Klik "Import" di menu atas
   - Choose file: pilih `database.sql`
   - Klik "Import"
   - Database `ftth_planner` akan dibuat otomatis

#### **Method B: Via Command Line**
```bash
# Buka Command Prompt di folder aplikasi
mysql -u root -p
CREATE DATABASE ftth_planner;
USE ftth_planner;
SOURCE database.sql;
EXIT;
```

#### **Method C: Update Database Existing**
```sql
# Jika sudah ada database lama
USE ftth_planner;
SOURCE update_database.sql;
```

### **Step 3: Deploy Aplikasi**

1. **Copy Files**
   ```
   - Extract source code
   - Copy folder ke: C:\xampp\htdocs\ftthplanner\
   - Pastikan semua file ter-copy dengan benar
   ```

2. **Verify Structure**
   ```
   C:\xampp\htdocs\ftthplanner\
   ├── 🏠 index.php                 # Dashboard utama
   ├── 👤 login.php                 # ⭐ BARU - Login page
   ├── 👥 users.php                 # ⭐ BARU - User management
   ├── ⚙️ config/
   │   └── database.php            # Database config
   ├── 🌐 api/                     # REST API dengan Authentication
   │   ├── auth.php               # ⭐ BARU - Authentication API
   │   ├── items.php              # CRUD items (role-based)
   │   ├── routes.php             # CRUD routes (role-based)
   │   ├── tube_colors.php        # Master data warna
   │   ├── splitters.php          # Master data splitter
   │   ├── statistics.php         # Real-time statistics
   │   └── users.php              # ⭐ BARU - User management API
   ├── 🎨 assets/
   │   ├── css/custom.css         # Custom styling
   │   └── js/
   │       ├── map.js            # Core mapping
   │       ├── app.js            # Application logic
   │       └── kmz-export.js     # Export functionality
   ├── 💾 database.sql           # Complete database schema
   ├── 🔄 update_database.sql    # ⭐ BARU - Update script
   ├── 📖 README.md              # Documentation
   └── 📋 Various guides...
   ```

### **Step 4: Konfigurasi Database**

Edit `config/database.php`:
```php
<?php
class Database {
    private $host = "localhost";
    private $db_name = "ftth_planner";
    private $username = "root";
    private $password = "";
    private $conn;
    
    // ... rest of configuration
}
?>
```

### **Step 5: First Access & Login**

1. **Buka Browser**: `http://localhost/ftthplanner`
2. **Login Required** (akan redirect ke login.php):
   ```
   Username: admin
   Password: password
   ```
3. **Default Accounts**:
   - `admin/password` - Full access (CRUD semua)
   - `teknisi1/password` - Read-only access
   - `teknisi2/password` - Read-only access
   - `supervisor/password` - Admin access

---

## 🌐 Option 2: Production VPS Ubuntu Server

### **Step 1: Server Preparation**

#### **Update System**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install curl wget unzip git -y
```

#### **Install LAMP Stack**
```bash
# Install Apache
sudo apt install apache2 -y
sudo systemctl start apache2
sudo systemctl enable apache2

# Install MySQL
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo systemctl enable mysql
sudo mysql_secure_installation

# Install PHP 8.0+
sudo apt install software-properties-common -y
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.1 php8.1-mysql php8.1-curl php8.1-mbstring php8.1-xml php8.1-zip libapache2-mod-php8.1


# Enable Apache modules
sudo systemctl restart apache2
sudo a2enmod rewrite
```

### **Step 2: Database Setup**

#### **Create Database & User**
```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE ftth_planner;
CREATE USER 'ftth_user'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON ftth_planner.* TO 'ftth_user'@'localhost';
FLUSH PRIVILEGES;
USE ftth_planner;
SOURCE /var/www/html/ftthplanner/database.sql;
EXIT;
```

### **Step 3: Deploy Application**

#### **Upload Files**
```bash
# Via Git (recommended)
cd /var/www/html
sudo git clone https://github.com/ripcord20/ftthplanner.git
sudo chown -R www-data:www-data ftthplanner/
sudo chmod -R 755 ftthplanner/

# Or via FTP/SFTP
# Upload all files to /var/www/html/ftthplanner/
```

#### **Configure Database**
```bash
sudo nano /var/www/html/ftthplanner/config/database.php
```

```php
private $host = "localhost";
private $db_name = "ftth_planner";
private $username = "ftth_user";
private $password = "secure_password_here";
```

### **Step 4: Apache Virtual Host**

#### **Create VHost Config**
```bash
sudo nano /etc/apache2/sites-available/ftthplanner.conf
```

```apache
<VirtualHost *:80>
    ServerAdmin admin@yourdomain.com
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    DocumentRoot /var/www/html/ftthplanner
    
    <Directory /var/www/html/ftthplanner>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/ftthplanner_error.log
    CustomLog ${APACHE_LOG_DIR}/ftthplanner_access.log combined
</VirtualHost>
```

#### **Enable Site**
```bash
sudo a2ensite ftthplanner.conf
sudo a2dissite 000-default.conf
sudo systemctl restart apache2
```

### **Step 5: SSL Certificate (Optional tapi Recommended)**

#### **Install Certbot**
```bash
sudo apt install certbot python3-certbot-apache -y
sudo certbot --apache -d yourdomain.com -d www.yourdomain.com
```

### **Step 6: Security & Optimization**

#### **Firewall Setup**
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Apache Full'
sudo ufw enable
```

#### **PHP Optimization**
```bash
sudo nano /etc/php/8.1/apache2/php.ini
```

```ini
# Recommended settings
memory_limit = 256M
upload_max_filesize = 50M
post_max_size = 50M
max_execution_time = 300
```

#### **MySQL Optimization**
```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

```ini
[mysqld]
innodb_buffer_pool_size = 512M
max_connections = 200
```

```bash
sudo systemctl restart apache2
sudo systemctl restart mysql
```

### **Step 7: Access Application**

1. **Domain Access**: `https://yourdomain.com`
2. **Login dengan default account**: `admin/password`
3. **Segera ubah password** di User Management

---

## 🔧 Konfigurasi Lanjutan

### **Performance Optimization**

#### **Enable Apache Compression**
```bash
sudo a2enmod deflate
sudo systemctl restart apache2
```

#### **Browser Caching (.htaccess)**
```apache
# Create /var/www/html/ftthplanner/.htaccess
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>
```

### **Backup Strategy**

#### **Database Backup Script**
```bash
#!/bin/bash
# /home/backup/db_backup.sh
BACKUP_DIR="/home/backup/ftth"
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u ftth_user -p'secure_password_here' ftth_planner > $BACKUP_DIR/ftth_planner_$DATE.sql
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

#### **Crontab Setup**
```bash
crontab -e
# Add this line for daily backup at 2 AM
0 2 * * * /home/backup/db_backup.sh
```

### **Monitoring & Logging**

#### **Error Monitoring**
```bash
# Monitor error logs
sudo tail -f /var/log/apache2/ftthplanner_error.log

# Monitor access logs
sudo tail -f /var/log/apache2/ftthplanner_access.log
```

#### **System Monitoring**
```bash
# Install htop for system monitoring
sudo apt install htop -y

# Monitor disk space
df -h

# Monitor memory usage
free -h
```

---

# 📖 CARA PENGGUNAAN APLIKASI

## 🔐 **Login & Authentication**

### **First Time Login**
1. **Akses aplikasi**: `http://localhost/ftthplanner` atau `https://yourdomain.com`
2. **Login dengan default account**:
   ```
   Username: admin
   Password: password
   ```
3. **Role-based Access**:
   - **Admin**: Full CRUD access (Create, Read, Update, Delete)
   - **Teknisi**: Read-only access (View only)

### **User Management (Admin Only)**
1. **Klik dropdown profile** di navbar atas kanan
2. **Pilih "User Management"**
3. **Tambah/Edit/Hapus user** sesuai kebutuhan
4. **Set role**: Admin atau Teknisi

---

## 📍 **Manajemen Item FTTH**

### **Menambah Item Baru**
1. **Via Sidebar**: Klik menu "Tambah OLT", "Tambah Tiang Tumpu", dll
2. **Via Map**: Klik langsung di peta untuk menambah item di lokasi tersebut
3. **Via Tombol**: Klik tombol "Tambah Item" di header card map
4. **Form Modal**: Isi semua field required dan klik "Simpan"

### **Jenis Item Available**
- 🏢 **OLT**: Optical Line Terminal (server pusat)
- 📡 **Tiang Tumpu**: Infrastruktur pendukung
- 🔗 **Tiang ODP**: Optical Distribution Point
- 🌐 **Tiang ODC**: Optical Distribution Cabinet
- 🔌 **Tiang Joint Closure**: ⭐ **BARU** Sambungan fiber optik
- 🏠 **Pelanggan**: End-user connection points
- 🖥️ **Server**: Server infrastruktur jaringan

### **Mengedit Item**
1. **Klik marker** di peta
2. **Klik tombol "Edit"** di popup
3. **Update informasi** di form modal
4. **Klik "Simpan"**

### **Memindahkan Item**
- **Drag & drop marker** langsung di peta
- **Posisi otomatis tersimpan** ke database
- **Real-time update** koordinat

---

## 🛣️ **Routing Kabel**

### **Membuat Route Baru**
1. **Mode Routing**: Klik tombol "Mode Routing" atau "Route" di popup item
2. **Pilih Item Asal**: Klik item pertama (starting point)
3. **Pilih Item Tujuan**: Klik item kedua (destination)
4. **Auto Route**: Sistem akan membuat route mengikuti jalan
5. **Distance Calculation**: Jarak otomatis dihitung dalam meter ⭐ **UPDATED**

### **Edit Route Existing**
1. **Klik route line** di peta
2. **Edit properties**: Tipe kabel, core count, status
3. **Status Options**: Planned, Installed, Maintenance

---

## 📊 **Monitoring & Lists**

### **Dashboard Statistics**
- **Real-time counters** untuk semua jenis item
- **Visual cards** dengan color indicators
- **Quick navigation** ke kategori

### **Daftar Item dengan Multiple Actions** ⭐ **BARU**
1. **Klik "Daftar Item"** di sidebar
2. **Select Multiple**: Checkbox di header untuk select all
3. **Individual Selection**: Checkbox per item
4. **Bulk Delete**: Tombol "Hapus Terpilih" untuk delete multiple
5. **Actions per Item**: Edit, Focus, Delete individual

### **Daftar Route dengan Bulk Operations** ⭐ **BARU**
1. **Klik "Routing Kabel"** di sidebar
2. **View semua route** dalam format tabel
3. **Multiple Selection**: Sama seperti item list
4. **Bulk Delete**: Hapus multiple route sekaligus
5. **Distance Display**: Jarak dalam meter untuk presisi

---

## 📥📤 **Export/Import Functions**

### **Export ke Google Earth**
1. **Klik tombol "Export KMZ"** di header peta atau sidebar
2. **File KMZ otomatis terdownload** dengan timestamp
3. **Buka di Google Earth** atau aplikasi GIS lainnya
4. **Lihat detail lengkap** setiap item dan route dengan styling

### **Import dari External Sources**
1. **Klik "Import KMZ"** di menu
2. **Upload file KMZ/KML** dari Google Earth atau GIS software
3. **Auto-parsing** dan validation
4. **Preview import** sebelum confirm
5. **Batch processing** untuk file besar

---

# 💾 STRUKTUR DATABASE

## 📊 **Tabel Utama**

### **Core Tables**
- `ftth_items`: Data item infrastruktur FTTH dengan koordinat dan properties
- `cable_routes`: Data routing kabel antar item dengan distance calculation
- `users`: ⭐ **BARU** - User accounts dengan role-based access control

### **Master Data Tables**
- `item_types`: Jenis-jenis item (7 kategori termasuk Joint Closure ⭐ **BARU**)
- `tube_colors`: Master data 32 warna tube dengan hex codes
- `splitter_types`: Master data jenis splitter (main & ODP)

### **Database Schema Evolution**
```sql
-- Original tables (v1.0)
ftth_items, cable_routes, item_types, tube_colors, splitter_types

-- Enhanced with Authentication (v2.0) ⭐ **BARU**
+ users table dengan bcrypt password hashing
+ session-based authentication
+ role-based permissions (admin/teknisi)

-- Latest Updates (v2.1) ⭐ **TERBARU**
+ Tiang Joint Closure item type
+ Enhanced distance calculation (meter precision)
+ Multiple delete capabilities
+ Optimized indexes untuk performa
```

### **Relasi Database**
- **Item Relations**: ftth_items → item_types, tube_colors, splitter_types
- **Route Relations**: cable_routes → ftth_items (from/to relationships)
- **User Relations**: session-based authentication untuk API access control
- **Foreign Keys**: Referential integrity untuk data consistency

---

# ⚙️ TEKNOLOGI YANG DIGUNAKAN

## 🎨 **Frontend Technology Stack**
- **AdminLTE 3.2**: Premium admin dashboard framework dengan responsive design
- **Leaflet.js**: Advanced interactive mapping library
- **OpenStreetMaps**: Multi-layer tile servers (Standard, Satellite, Terrain, CartoDB)
- **Leaflet Routing Machine**: Intelligent route calculation
- **Bootstrap 4**: Modern CSS framework untuk responsive UI
- **jQuery**: Enhanced JavaScript functionality dengan AJAX
- **Font Awesome 6**: Professional icon library (1000+ icons)
- **JSZip**: Advanced compression untuk KMZ export/import
- **FileSaver.js**: Client-side file download functionality

## 🛠️ **Backend Technology Stack**
- **PHP 8.0+**: Modern server-side scripting dengan enhanced performance
- **MySQL 8.0**: Advanced database management dengan JSON support
- **PDO**: Secure database abstraction dengan prepared statements
- **bcrypt**: Industry-standard password hashing untuk security
- **Session Management**: Secure authentication dengan role-based access
- **RESTful API**: Modern API architecture dengan comprehensive error handling

## 🗺️ **Mapping & GIS Technology**
- **OpenStreetMaps**: Global open-source map data
- **Leaflet**: Lightweight map rendering engine (38KB gzipped)
- **OSRM**: Open Source Routing Machine untuk intelligent pathfinding
- **Multiple Tile Providers**: Versatile map visualization options
- **KMZ/KML Support**: Google Earth integration untuk professional GIS workflow

## 🔐 **Security & Authentication**
- **Session-based Auth**: Secure login/logout dengan auto-timeout
- **Role-based Access Control (RBAC)**: Granular permissions (admin/teknisi)
- **CORS Headers**: Proper cross-origin resource sharing
- **Input Validation**: Comprehensive data sanitization
- **SQL Injection Protection**: PDO prepared statements
- **Password Security**: bcrypt hashing dengan salt

---

# 🌟 FITUR LANJUTAN & ADVANCED CAPABILITIES

## 🎯 **Interactive Features**

### **Drag & Drop Items**
- **Real-time Movement**: Semua marker dapat di-drag ke posisi baru
- **Auto-save**: Update koordinat otomatis tersimpan ke database
- **Smooth Animation**: Visual feedback saat drag operation
- **Position Validation**: Koordinat validation dan error handling

### **Interactive Popup**
- **Rich Information**: Info lengkap item saat klik marker
- **Action Buttons**: Edit, route, dan hapus dalam popup
- **Dynamic Content**: Context-aware actions berdasarkan role user
- **Quick Access**: Fast action tanpa page reload

### **Advanced Route Visualization**
- **Route Status Color Coding**:
  - 🟢 **Installed**: Garis solid hijau (route sudah terpasang)
  - 🟡 **Planned**: Garis putus-putus kuning (route perencanaan)
  - 🔴 **Maintenance**: Garis putus-putus merah (route maintenance)
- **Interactive Routes**: Klik route untuk edit properties
- **Distance Display**: Jarak real-time dalam meter ⭐ **UPDATED**

### **Responsive Design Excellence**
- **Multi-device Support**: Optimized untuk desktop, tablet, dan mobile
- **Adaptive UI**: Map dan form menyesuaikan ukuran layar
- **Touch-friendly**: Gesture support untuk mobile devices
- **Performance Optimized**: Fast loading dan smooth interactions

## 📁 **Professional Export/Import**

### **Enhanced KMZ Export**
- **Complete Data Export**: Semua items dan routes ke format Google Earth
- **Custom Styling**: Styling sesuai jenis item dengan icon dan color
- **Rich Metadata**: Informasi lengkap dalam popup Google Earth
- **GIS Compatibility**: Kompatibel dengan QGIS, AutoCAD, ArcGIS
- **Batch Export**: Support untuk dataset besar dengan progress tracking

### **Smart KMZ/KML Import** ⭐ **ENHANCED**
- **Multi-format Support**: KMZ, KML, MultiGeometry, Polygon, LineString
- **Intelligent Parser**: Auto-detect format dan struktur data
- **Data Validation**: Comprehensive validation sebelum import
- **Preview Mode**: Review data sebelum final import
- **Error Recovery**: Robust error handling dan detailed reporting

## 🚀 **Performance & Scalability**

### **Optimized Architecture**
- **Lazy Loading**: Progressive data loading untuk performance
- **Caching Strategy**: Browser dan server-side caching
- **Database Indexing**: Optimized queries untuk fast retrieval
- **AJAX Optimization**: Non-blocking UI updates

### **Scalability Features**
- **Large Dataset Support**: Handle 10K+ items dengan smooth performance
- **Batch Operations**: Multiple delete dan bulk actions
- **Memory Management**: Efficient memory usage untuk large maps
- **Progressive Enhancement**: Features degrade gracefully

---

# 🛠️ TROUBLESHOOTING & DEBUGGING

## 🔧 **Common Issues & Solutions**

### **Database Connection Issues**

#### **Windows XAMPP:**
```bash
# Cek status MySQL di XAMPP Control Panel
- Pastikan MySQL status "Running" (hijau)
- Restart MySQL jika merah atau kuning
- Cek port 3306 tidak digunakan aplikasi lain
```

#### **Ubuntu VPS:**
```bash
# Cek status MySQL service
sudo systemctl status mysql

# Restart jika ada masalah
sudo systemctl restart mysql

# Check connection
mysql -u ftth_user -p ftth_planner
```

#### **Configuration:**
- Cek `config/database.php` sesuai environment
- Pastikan database `ftth_planner` sudah dibuat
- Verify user permissions dan password

### **Authentication & Login Issues**

#### **Cannot Login:**
```sql
-- Reset password jika lupa
UPDATE users SET password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' 
WHERE username = 'admin';
-- Password akan menjadi: password
```

#### **Session Issues:**
- Clear browser cookies dan cache
- Cek PHP session configuration
- Pastikan session directory writable

### **Map & Visualization Issues**

#### **Map Tidak Muncul:**
- **Koneksi Internet**: Required untuk tile loading
- **JavaScript Error**: Cek browser console (F12)
- **API Keys**: Tidak diperlukan untuk OpenStreetMaps
- **CORS Issues**: Cek browser network tab

#### **Marker Tidak Tampil:**
- Cek console untuk error API calls
- Verify database ada data di ftth_items
- Pastikan koordinat latitude/longitude valid

### **Performance Issues**

#### **Slow Loading:**
```bash
# Check server resources
htop                    # CPU/Memory usage
df -h                   # Disk space
mysql -e "SHOW PROCESSLIST;"  # Database queries
```

#### **Database Optimization:**
```sql
-- Optimize tables
OPTIMIZE TABLE ftth_items, cable_routes;

-- Check indexes
SHOW INDEX FROM ftth_items;

-- Add missing indexes if needed
CREATE INDEX idx_coordinates ON ftth_items(latitude, longitude);
```

### **Import/Export Issues**

#### **KMZ Export Gagal:**
- Cek browser support untuk download
- Clear browser cache
- Pastikan ada data untuk di-export

#### **KMZ Import Error:**
- Validate file format (harus valid KMZ/KML)
- Check file size (max 50MB default)
- Review PHP upload limits

## 🚨 **Emergency Recovery**

### **Database Backup & Restore**

#### **Windows XAMPP:**
```bash
# Backup database
cd C:\xampp\mysql\bin
mysqldump -u root -p ftth_planner > backup.sql

# Restore database
mysql -u root -p ftth_planner < backup.sql
```

#### **Ubuntu VPS:**
```bash
# Backup dengan timestamp
mysqldump -u ftth_user -p ftth_planner > ftth_backup_$(date +%Y%m%d).sql

# Restore
mysql -u ftth_user -p ftth_planner < ftth_backup_20240101.sql
```

### **Reset to Default**

#### **Reset User Accounts:**
```sql
-- Delete semua user
DELETE FROM users;

-- Insert default users
INSERT INTO users (username, password, role, full_name, email) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Administrator System', 'admin@ftthplanner.com'),
('teknisi1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teknisi', 'Teknisi Lapangan 1', 'teknisi1@ftthplanner.com');
```

### **Debug Mode**

#### **Enable Debug Logging:**
```php
// Add to config/database.php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', 'debug.log');
```

#### **Browser Debug:**
```javascript
// Add to browser console untuk debug AJAX
$.ajaxSetup({
    beforeSend: function(xhr, settings) {
        console.log('Request:', settings.url, settings.data);
    },
    complete: function(xhr, status) {
        console.log('Response:', xhr.status, xhr.responseText);
    }
});
```

---

# 🚀 PENGEMBANGAN LEBIH LANJUT

## 🎯 **Roadmap & Future Features**

### **✅ Already Implemented (v2.1)**
- ✅ **User Management**: Login dan role-based access (admin/teknisi)
- ✅ **Authentication System**: Session-based dengan bcrypt security
- ✅ **Multiple Delete**: Bulk operations untuk items dan routes
- ✅ **Enhanced Distance**: Meter precision untuk routing
- ✅ **Joint Closure Type**: New item category untuk fiber connections
- ✅ **API Security**: Role-based access control semua endpoints

### **🔄 Coming Soon (v3.0)**

#### **Advanced Reporting & Analytics**
- 📊 **Dashboard Analytics**: Charts dan graphs untuk network overview
- 📈 **Performance Metrics**: Core utilization, route efficiency statistics
- 📋 **PDF Reports**: Professional reports dengan maps dan data tables
- 📊 **Excel Export**: Data export dengan formatting dan charts

#### **Mobile & Integration**
- 📱 **Mobile PWA**: Progressive Web App untuk field survey
- 🔌 **REST API v2**: Extended API untuk third-party integration
- 🌐 **Webhook Support**: Real-time notifications dan integrations
- 📡 **GPS Integration**: Live tracking untuk mobile devices

#### **Advanced GIS Features**
- 🗺️ **Offline Maps**: Cache maps untuk area tanpa internet
- 📐 **Advanced Measurement**: Area calculation, elevation profiles
- 🎨 **Custom Styling**: User-defined colors dan symbols
- 📊 **Heatmaps**: Density visualization untuk network analysis

## 🛠️ **Customization Guide**

### **Theme & Styling**
```css
/* Edit assets/css/custom.css */
:root {
    --primary-color: #007bff;
    --secondary-color: #6c757d;
    --success-color: #28a745;
}

/* Custom marker colors */
.marker-olt { background-color: #FF6B6B; }
.marker-tiang { background-color: #4ECDC4; }
```

### **Add New Item Types**
```sql
-- Add to database
INSERT INTO item_types (name, icon, color) VALUES
('New Type', 'fas fa-new-icon', '#COLOR');
```

```javascript
// Update assets/js/map.js
case 'New Type':
    iconClass = 'fas fa-new-icon';
    break;
```

### **Custom Form Fields**
```php
// Modify form in index.php
<div class="form-group">
    <label for="customField">Custom Field</label>
    <input type="text" class="form-control" id="customField" name="custom_field">
</div>
```

### **API Extensions**
```php
// Add new endpoint in api/
// api/custom.php
<?php
require_once 'auth.php';
checkPermission();

// Your custom API logic here
?>
```

## 📄 **License & Usage**

### **Open Source License**
- **MIT License**: Free untuk personal dan commercial use
- **Source Code**: Full access untuk modification dan redistribution
- **No Warranty**: Software provided "as-is" tanpa warranty
- **Attribution**: Credit appreciated tapi tidak required

### **Commercial Usage**
- ✅ **Commercial Projects**: Boleh digunakan untuk project komersial
- ✅ **Modification**: Boleh dimodifikasi sesuai kebutuhan
- ✅ **Redistribution**: Boleh didistribusikan dengan atau tanpa modifikasi
- ✅ **Private Use**: Boleh digunakan untuk internal company

## 📞 **Support & Community**

### **Documentation**
- 📖 **User Guide**: Comprehensive documentation dalam bahasa Indonesia
- 🎥 **Video Tutorials**: Step-by-step installation dan usage guides
- 💻 **Code Examples**: Sample implementations dan customizations
- 📚 **API Documentation**: Complete REST API reference

### **Community Support**
- 💬 **GitHub Issues**: Bug reports dan feature requests
- 🤝 **Contributions**: Pull requests welcome
- 📧 **Email Support**: Technical questions dan consultation
- 👥 **User Community**: Sharing tips dan best practices

### **Professional Services**
- 🔧 **Custom Development**: Feature development dan integrations
- 🚀 **Deployment Service**: VPS setup dan configuration
- 📊 **Training & Consultation**: Team training dan best practices
- 🛠️ **Maintenance Support**: Ongoing support dan updates

---

## 🎉 **FINAL NOTES**

### **🌟 Key Advantages:**
- **🚀 Production Ready**: Tested dan optimized untuk real-world usage
- **🔒 Enterprise Security**: Bank-level authentication dan data protection  
- **📱 Future-Proof**: Modern architecture siap untuk scaling
- **🌍 International Standard**: Mengikuti best practices industri global
- **💰 Cost Effective**: 1/100 harga dari software komersial sejenis

### **⚠️ Important Reminders:**
- **📦 Backup First**: Selalu backup database sebelum major changes
- **🔐 Change Default Passwords**: Update default user passwords untuk security
- **🌐 Keep Updated**: Monitor untuk updates dan security patches
- **📖 Read Documentation**: Pelajari semua fitur untuk maksimum benefit

---

**🎯 FTTH Planner - Revolutionizing Infrastructure Planning in Indonesia!**


*Copyright © 2024 FTTH Planner Team. Licensed under MIT License.*



