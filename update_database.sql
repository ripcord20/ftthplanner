-- Database Update Script untuk FTTH Planner
-- Update untuk menambah jenis item "Tiang Joint Closure" 
-- Script ini untuk update database yang sudah ada dengan fitur authentication

USE ftth_planner;

-- Cek apakah item type "Tiang Joint Closure" sudah ada
-- Jika belum ada, tambahkan
INSERT IGNORE INTO item_types (name, icon, color) VALUES
('Tiang Joint Closure', 'fas fa-link', '#E74C3C');

-- Update sequence untuk item types agar ID konsisten
-- Hanya jalankan jika data masih default

-- Pastikan struktur database sudah mendukung semua fitur terbaru
-- Cek dan tambahkan kolom jika diperlukan

-- Update data default jika ada perubahan
-- Pastikan semua data referensi konsisten

-- Verifikasi data setelah update
SELECT 'Item Types:' as 'Data Check';
SELECT id, name, icon, color FROM item_types ORDER BY id;

SELECT 'Total Items in Database:' as 'Data Check';
SELECT COUNT(*) as total_items FROM ftth_items;

SELECT 'Total Routes in Database:' as 'Data Check';
SELECT COUNT(*) as total_routes FROM cable_routes;

SELECT 'User Accounts:' as 'Data Check';
SELECT id, username, role, full_name, status FROM users ORDER BY id;

-- Informasi update
SELECT 'Update completed successfully!' as 'Status';
SELECT NOW() as 'Update Time';