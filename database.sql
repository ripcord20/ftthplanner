-- Database untuk FTTH Planner dengan Authentication System
-- Versi: 2.0 (Updated dengan sistem user dan role)
CREATE DATABASE IF NOT EXISTS ftth_planner;
USE ftth_planner;

-- Tabel untuk menyimpan jenis item FTTH
CREATE TABLE item_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(100),
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel untuk menyimpan warna tube
CREATE TABLE tube_colors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    color_name VARCHAR(30) NOT NULL,
    hex_code VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel untuk menyimpan jenis splitter
CREATE TABLE splitter_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type VARCHAR(20) NOT NULL, -- 'main' untuk jaringan utama, 'odp' untuk ODP
    ratio VARCHAR(10) NOT NULL, -- 1:2, 1:3, 1:4, 1:8, 1:16
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel utama untuk menyimpan item-item FTTH di maps
CREATE TABLE ftth_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_type_id INT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    tube_color_id INT,
    core_used INT COMMENT 'Core yang sedang digunakan dari total kapasitas',
    core_color_id INT NULL COMMENT 'Warna core yang digunakan (referensi ke tube_colors)',
    item_cable_type ENUM('backbone', 'distribution', 'drop_core', 'feeder', 'branch') NULL DEFAULT 'distribution' COMMENT 'Jenis kabel yang digunakan pada item ini',
    total_core_capacity INT NULL DEFAULT 24 COMMENT 'Total kapasitas core untuk item ini',
    splitter_main_id INT,
    splitter_odp_id INT,
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (item_type_id) REFERENCES item_types(id),
    FOREIGN KEY (tube_color_id) REFERENCES tube_colors(id),
    FOREIGN KEY (core_color_id) REFERENCES tube_colors(id),
    FOREIGN KEY (splitter_main_id) REFERENCES splitter_types(id),
    FOREIGN KEY (splitter_odp_id) REFERENCES splitter_types(id)
);

-- Tabel untuk menyimpan routing kabel
CREATE TABLE cable_routes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    from_item_id INT,
    to_item_id INT,
    route_coordinates TEXT, -- JSON array of lat,lng coordinates
    distance DECIMAL(8,2), -- dalam meter
    cable_type VARCHAR(50),
    core_count INT,
    status ENUM('planned', 'installed', 'maintenance') DEFAULT 'planned',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (from_item_id) REFERENCES ftth_items(id),
    FOREIGN KEY (to_item_id) REFERENCES ftth_items(id)
);

-- Insert data default untuk item types
INSERT INTO item_types (name, icon, color) VALUES
('OLT', 'fas fa-server', '#FF6B6B'),
('Tiang Tumpu', 'fas fa-tower-broadcast', '#4ECDC4'),
('Tiang ODP', 'fas fa-project-diagram', '#45B7D1'),
('Tiang ODC', 'fas fa-network-wired', '#96CEB4'),
('Tiang Joint Closure', 'fas fa-link', '#E74C3C'),
('Pelanggan', 'fas fa-home', '#FFA500'),
('Server', 'fas fa-server', '#8E44AD');

-- Insert data default untuk warna tube (32 warna total)
INSERT INTO tube_colors (color_name, hex_code) VALUES
('Biru', '#0066CC'),
('Orange', '#FF6600'),
('Hijau', '#00CC66'),
('Coklat', '#996633'),
('Abu-abu', '#666666'),
('Putih', '#FFFFFF'),
('Merah', '#CC0000'),
('Hitam', '#000000'),
('Kuning', '#FFCC00'),
('Violet', '#9900CC'),
('Pink', '#FF6699'),
('Aqua', '#00CCCC'),
('Turquoise', '#40E0D0'),
('Lime', '#32CD32'),
('Magenta', '#FF00FF'),
('Cyan', '#00FFFF'),
('Indigo', '#4B0082'),
('Crimson', '#DC143C'),
('Gold', '#FFD700'),
('Silver', '#C0C0C0'),
('Teal', '#008080'),
('Navy', '#000080'),
('Coral', '#FF7F50'),
('Salmon', '#FA8072'),
('Lavender', '#E6E6FA'),
('Beige', '#F5F5DC'),
('Olive', '#808000'),
('Maroon', '#800000'),
('Khaki', '#F0E68C'),
('Plum', '#DDA0DD'),
('Bronze', '#CD7F32'),
('Emerald', '#50C878');

-- Insert data default untuk splitter types
INSERT INTO splitter_types (type, ratio) VALUES
('main', '1:2'),
('main', '1:3'),
('main', '1:4'),
('odp', '1:2'),
('odp', '1:4'),
('odp', '1:8'),
('odp', '1:16');

-- Tabel untuk menyimpan user dan role
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'teknisi') NOT NULL DEFAULT 'teknisi',
    full_name VARCHAR(100),
    email VARCHAR(100),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert user default dengan sistem authentication
-- Password untuk semua user: "password" (hashed dengan bcrypt)
INSERT INTO users (username, password, role, full_name, email) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Administrator System', 'admin@ftthplanner.com'),
('teknisi1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teknisi', 'Teknisi Lapangan 1', 'teknisi1@ftthplanner.com'),
('teknisi2', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teknisi', 'Teknisi Lapangan 2', 'teknisi2@ftthplanner.com'),
('supervisor', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Supervisor Jaringan', 'supervisor@ftthplanner.com');

-- Create indexes for performance optimization
CREATE INDEX idx_core_color ON ftth_items(core_color_id);
CREATE INDEX idx_cable_type ON ftth_items(item_cable_type);
CREATE INDEX idx_core_usage ON ftth_items(core_used, total_core_capacity);
CREATE INDEX idx_username ON users(username);
CREATE INDEX idx_user_role ON users(role);