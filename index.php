<?php
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit();
}

$user_role = $_SESSION['role'];
$user_name = $_SESSION['full_name'] ?? $_SESSION['username'];
$is_admin = ($user_role === 'admin');
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>FTTH Planner V1.5 | Dashboard</title>

    <!-- Google Font: Source Sans Pro -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700&display=fallback">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <!-- AdminLTE -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/css/adminlte.min.css">
    <!-- Leaflet CSS (Latest Version) -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <!-- Leaflet Fullscreen Plugin -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet-fullscreen@1.0.1/dist/leaflet.fullscreen.css" />
    <!-- Leaflet Routing Machine -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />
    <!-- Custom CSS -->
    <link rel="stylesheet" href="assets/css/custom.css?v=<?php echo time(); ?>">
</head>
<body class="hold-transition sidebar-mini layout-fixed">
<div class="wrapper">

    <!-- Preloader -->
    <div class="preloader flex-column justify-content-center align-items-center">
        <i class="fas fa-network-wired fa-3x text-primary"></i>
        <h4 class="mt-3">FTTH Planner V1.5</h4>
    </div>

    <!-- Navbar -->
    <nav class="main-header navbar navbar-expand navbar-white navbar-light">
        <!-- Left navbar links -->
        <ul class="navbar-nav">
            <li class="nav-item">
                <a class="nav-link" data-widget="pushmenu" href="#" role="button"><i class="fas fa-bars"></i></a>
            </li>
            <li class="nav-item d-none d-sm-inline-block">
                <a href="index.php" class="nav-link">Dashboard</a>
            </li>
        </ul>

        <!-- Right navbar links -->
        <ul class="navbar-nav ml-auto">
            <!-- User Dropdown Menu -->
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown">
                    <i class="fas fa-user-circle"></i>
                    <span class="d-none d-sm-inline"><?php echo htmlspecialchars($user_name); ?></span>
                    <span class="badge badge-<?php echo $is_admin ? 'danger' : 'info'; ?> ml-1">
                        <?php echo $is_admin ? 'Admin' : 'Teknisi'; ?>
                    </span>
                </a>
                <div class="dropdown-menu dropdown-menu-right">
                    <div class="dropdown-header">
                        <strong><?php echo htmlspecialchars($user_name); ?></strong><br>
                        <small class="text-muted"><?php echo htmlspecialchars($_SESSION['username']); ?></small>
                    </div>
                    <div class="dropdown-divider"></div>
                    <a class="dropdown-item" href="#" onclick="showProfile()">
                        <i class="fas fa-user mr-2"></i>Profil
                    </a>
                    <?php if ($is_admin): ?>
                    <a class="dropdown-item" href="#" onclick="showUserManagement()">
                        <i class="fas fa-users mr-2"></i>Kelola User
                    </a>
                    <?php endif; ?>
                    <div class="dropdown-divider"></div>
                    <a class="dropdown-item text-danger" href="#" onclick="logout()">
                        <i class="fas fa-sign-out-alt mr-2"></i>Logout
                    </a>
                </div>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-widget="fullscreen" href="#" role="button">
                    <i class="fas fa-expand-arrows-alt"></i>
                </a>
            </li>
        </ul>
    </nav>

    <!-- Main Sidebar Container -->
    <aside class="main-sidebar sidebar-dark-primary elevation-4">
        <!-- Brand Logo -->
        <a href="index.php" class="brand-link">
            <i class="fas fa-network-wired brand-image img-circle elevation-3" style="opacity: .8; margin-left: 10px; color: white;"></i>
            <span class="brand-text font-weight-light">FTTH Planner V1.5</span>
        </a>

        <!-- Sidebar -->
        <div class="sidebar">
            <!-- Sidebar Menu -->
            <nav class="mt-2">
                <ul class="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
                    <li class="nav-item">
                        <a href="#" class="nav-link active">
                            <i class="nav-icon fas fa-map"></i>
                            <p>Peta FTTH</p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link" onclick="showItemList()">
                            <i class="nav-icon fas fa-list"></i>
                            <p>Daftar Item</p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link" onclick="showRouteList()">
                            <i class="nav-icon fas fa-route"></i>
                            <p>Routing Kabel</p>
                        </a>
                    </li>
                    <li class="nav-header">NAVIGASI PETA</li>
                    <li class="nav-item">
                        <a href="#" class="nav-link" onclick="zoomToItems()">
                            <i class="nav-icon fas fa-expand-arrows-alt" style="color: #17a2b8;"></i>
                            <p>Zoom Semua Item</p>
                        </a>
                    </li>
                    <li class="nav-item has-treeview">
                        <a href="#" class="nav-link">
                            <i class="nav-icon fas fa-search-location" style="color: #6f42c1;"></i>
                            <p>
                                Zoom ke Item
                                <i class="right fas fa-angle-left"></i>
                            </p>
                        </a>
                        <ul class="nav nav-treeview">
                            <li class="nav-item">
                                <a href="#" class="nav-link" onclick="zoomToItemType('OLT')">
                                    <i class="fas fa-server nav-icon" style="color: #FF6B6B;"></i>
                                    <p>Zoom ke OLT</p>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#" class="nav-link" onclick="zoomToItemType('Tiang Tumpu')">
                                    <i class="fas fa-tower-broadcast nav-icon" style="color: #4ECDC4;"></i>
                                    <p>Zoom ke Tiang</p>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#" class="nav-link" onclick="zoomToItemType('Tiang ODP')">
                                    <i class="fas fa-project-diagram nav-icon" style="color: #45B7D1;"></i>
                                    <p>Zoom ke Tiang ODP</p>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#" class="nav-link" onclick="zoomToItemType('Tiang ODC')">
                                    <i class="fas fa-network-wired nav-icon" style="color: #96CEB4;"></i>
                                    <p>Zoom ke Tiang ODC</p>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#" class="nav-link" onclick="zoomToItemType('Tiang Joint Closure')">
                                    <i class="fas fa-link nav-icon" style="color: #E74C3C;"></i>
                                    <p>Zoom ke Joint Closure</p>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#" class="nav-link" onclick="zoomToItemType('Server')">
                                    <i class="fas fa-server nav-icon" style="color: #8E44AD;"></i>
                                    <p>Zoom ke Server</p>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#" class="nav-link" onclick="zoomToItemType('Pelanggan')">
                                    <i class="fas fa-home nav-icon" style="color: #FFA500;"></i>
                                    <p>Zoom ke Pelanggan</p>
                                </a>
                            </li>
                        </ul>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link" onclick="locateUser()">
                            <i class="nav-icon fas fa-location-arrow" style="color: #dc3545;"></i>
                            <p>Cari Lokasi Saya</p>
                        </a>
                    </li>
                    <li class="nav-header">IMPORT / EXPORT DATA</li>
                    <li class="nav-item">
                        <a href="#" class="nav-link" onclick="showImportKMZModal()">
                            <i class="nav-icon fas fa-upload" style="color: #ffc107;"></i>
                            <p>Import KMZ</p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link" onclick="exportToKMZ()">
                            <i class="nav-icon fas fa-download" style="color: #28a745;"></i>
                            <p>Export ke KMZ</p>
                        </a>
                    </li>
                    <?php if ($is_admin): ?>
                    <li class="nav-header">ITEM FTTH</li>
                    <li class="nav-item">
                        <a href="#" class="nav-link" onclick="addNewItem('OLT')">
                            <i class="nav-icon fas fa-server" style="color: #FF6B6B;"></i>
                            <p>Tambah OLT</p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link" onclick="addNewItem('Tiang Tumpu')">
                            <i class="nav-icon fas fa-tower-broadcast" style="color: #4ECDC4;"></i>
                            <p>Tambah Tiang Tumpu</p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link" onclick="addNewItem('Tiang ODP')">
                            <i class="nav-icon fas fa-project-diagram" style="color: #45B7D1;"></i>
                            <p>Tambah Tiang ODP</p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link" onclick="addNewItem('Tiang ODC')">
                            <i class="nav-icon fas fa-network-wired" style="color: #96CEB4;"></i>
                            <p>Tambah Tiang ODC</p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link" onclick="addNewItem('Tiang Joint Closure')">
                            <i class="nav-icon fas fa-link" style="color: #E74C3C;"></i>
                            <p>Tambah Joint Closure</p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link" onclick="addNewItem('Server')">
                            <i class="nav-icon fas fa-server" style="color: #8E44AD;"></i>
                            <p>Tambah Server</p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link" onclick="addNewItem('Pelanggan')">
                            <i class="nav-icon fas fa-home" style="color: #FFA500;"></i>
                            <p>Tambah Pelanggan</p>
                        </a>
                    </li>
                    <?php endif; ?>
                </ul>
            </nav>
        </div>
    </aside>

    <!-- Content Wrapper -->
    <div class="content-wrapper">
        <!-- Content Header -->
        <div class="content-header">
            <div class="container-fluid">
                <div class="row mb-2">
                    <div class="col-sm-6">
                        <h1 class="m-0">Dashboard FTTH Planner V1.5</h1>
                    </div>
                    <div class="col-sm-6">
                        <ol class="breadcrumb float-sm-right">
                            <li class="breadcrumb-item"><a href="#">Home</a></li>
                            <li class="breadcrumb-item active">Dashboard</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main content -->
        <section class="content">
            <div class="container-fluid">
                <!-- Map Container -->
                <div class="row">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">
                                    <i class="fas fa-map mr-1"></i>
                                    Peta Infrastruktur FTTH
                                </h3>
                                <div class="card-tools">
                                    <?php if ($is_admin): ?>
                                    <button type="button" class="btn btn-primary btn-sm" onclick="showAddItemModal()">
                                        <i class="fas fa-plus"></i> Tambah Item
                                    </button>
                                    <button type="button" class="btn btn-info btn-sm" onclick="showRoutingMode()">
                                        <i class="fas fa-route"></i> Mode Routing
                                    </button>
                                    <button type="button" class="btn btn-warning btn-sm" onclick="showImportKMZModal()">
                                        <i class="fas fa-upload"></i> Import KMZ
                                    </button>
                                    <?php endif; ?>
                                    <button type="button" class="btn btn-success btn-sm" onclick="exportToKMZ()">
                                        <i class="fas fa-download"></i> Export KMZ
                                    </button>
                                    
                                    <!-- Map Zoom Controls -->
                                    <div class="map-zoom-controls">
                                        <button type="button" class="btn btn-outline-secondary btn-sm" onclick="zoomToItems()" title="Zoom ke Semua Item">
                                            <i class="fas fa-expand-arrows-alt"></i>
                                        </button>
                                        <button type="button" class="btn btn-outline-secondary btn-sm" onclick="locateUser()" title="Cari Lokasi Saya">
                                            <i class="fas fa-location-arrow"></i>
                                        </button>
                                        <button type="button" class="btn btn-outline-secondary btn-sm" onclick="map.setView([-2.5, 118], 5)" title="Zoom ke Indonesia">
                                            <i class="fas fa-home"></i>
                                        </button>
                                        <button type="button" class="btn btn-outline-secondary btn-sm" onclick="map.zoomIn()" title="Zoom In (+)">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                        <button type="button" class="btn btn-outline-secondary btn-sm" onclick="map.zoomOut()" title="Zoom Out (-)">
                                            <i class="fas fa-minus"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="card-body p-0">
                                <div id="map" style="height: 600px;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Statistics Cards -->
                <div class="row">
                    <div class="col-lg-2 col-6">
                        <div class="small-box bg-info">
                            <div class="inner">
                                <h3 id="stat-olt">0</h3>
                                <p>OLT</p>
                            </div>
                            <div class="icon">
                                <i class="fas fa-server"></i>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-2 col-6">
                        <div class="small-box bg-success">
                            <div class="inner">
                                <h3 id="stat-tiang">0</h3>
                                <p>Tiang</p>
                            </div>
                            <div class="icon">
                                <i class="fas fa-tower-broadcast"></i>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-2 col-6">
                        <div class="small-box bg-warning">
                            <div class="inner">
                                <h3 id="stat-odp">0</h3>
                                <p>ODP</p>
                            </div>
                            <div class="icon">
                                <i class="fas fa-project-diagram"></i>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-2 col-6">
                        <div class="small-box bg-danger">
                            <div class="inner">
                                <h3 id="stat-odc">0</h3>
                                <p>ODC</p>
                            </div>
                            <div class="icon">
                                <i class="fas fa-network-wired"></i>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-2 col-6">
                        <div class="small-box bg-primary">
                            <div class="inner">
                                <h3 id="stat-pelanggan">0</h3>
                                <p>Pelanggan</p>
                            </div>
                            <div class="icon">
                                <i class="fas fa-home"></i>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-2 col-6">
                        <div class="small-box bg-secondary">
                            <div class="inner">
                                <h3 id="stat-routes">0</h3>
                                <p>Routes</p>
                            </div>
                            <div class="icon">
                                <i class="fas fa-route"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>

    <!-- Footer -->
    <footer class="main-footer">
        <strong>Copyright &copy; 2025 <a href="#">FTTH Planner V1.5</a> by Saputra Budi.</strong>
        Semua hak dilindungi undang-undang.
        <div class="float-right d-none d-sm-inline-block">
            <b>Versi</b> 1.5.0
        </div>
    </footer>
</div>

<!-- Add/Edit Item Modal -->
<div class="modal fade" id="itemModal" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title" id="itemModalTitle">Tambah Item FTTH</h4>
                <button type="button" class="close" data-dismiss="modal">
                    <span>&times;</span>
                </button>
            </div>
            <form id="itemForm">
                <div class="modal-body">
                    <input type="hidden" id="itemId" name="id">
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="itemType">Jenis Item</label>
                                <select class="form-control" id="itemType" name="item_type" required>
                                    <option value="">Pilih Jenis Item</option>
                                    <option value="1">OLT</option>
                                    <option value="2">Tiang Tumpu</option>
                                    <option value="3">Tiang ODP</option>
                                    <option value="4">Tiang ODC</option>
                                    <option value="5">Tiang Joint Closure</option>
                                    <option value="6">Pelanggan</option>
                                    <option value="7">Server</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="itemName">Nama Item</label>
                                <input type="text" class="form-control" id="itemName" name="name" required>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="itemDescription">Deskripsi</label>
                        <textarea class="form-control" id="itemDescription" name="description" rows="3"></textarea>
                    </div>

                    <div class="form-group">
                        <label for="itemAddress">Alamat</label>
                        <textarea class="form-control" id="itemAddress" name="address" rows="2"></textarea>
                    </div>

                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="itemLat">Latitude <span class="text-danger">*</span></label>
                                <input type="number" step="any" class="form-control" id="itemLat" name="latitude" placeholder="Contoh: -6.2088">
                                <small class="form-text text-muted">Koordinat Lintang (Latitude)</small>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="itemLng">Longitude <span class="text-danger">*</span></label>
                                <input type="number" step="any" class="form-control" id="itemLng" name="longitude" placeholder="Contoh: 106.8456">
                                <small class="form-text text-muted">Koordinat Bujur (Longitude)</small>
                            </div>
                        </div>
                    </div>

                    <div class="alert alert-info" role="alert">
                        <i class="fas fa-info-circle"></i>
                        <strong>Cara menentukan lokasi:</strong>
                        <br>• Klik tombol "Pilih di Peta" di bawah ini
                        <br>• Atau tutup dialog ini dan klik langsung di peta, lalu pilih "Tambah Item"
                    </div>

                    <div class="text-center mb-3">
                        <button type="button" class="btn btn-outline-primary" onclick="selectLocationOnMap()">
                            <i class="fas fa-map-marker-alt"></i> Pilih Lokasi di Peta
                        </button>
                    </div>

                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="tubeColor">Warna Tube</label>
                                <select class="form-control" id="tubeColor" name="tube_color_id">
                                    <option value="">Pilih Warna Tube</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="coreColor">Warna Core</label>
                                <select class="form-control" id="coreColor" name="core_color_id">
                                    <option value="">Pilih Warna Core</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="cableType">Jenis Kabel</label>
                                <select class="form-control" id="cableType" name="item_cable_type">
                                    <option value="">Pilih Jenis Kabel</option>
                                    <option value="backbone">Backbone</option>
                                    <option value="distribution">Distribution</option>
                                    <option value="drop_core">Drop Core</option>
                                    <option value="feeder">Feeder</option>
                                    <option value="branch">Branch</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="totalCoreCapacity">Kapasitas Core Total</label>
                                <select class="form-control" id="totalCoreCapacity" name="total_core_capacity">
                                    <option value="2">2 Core</option>
                                    <option value="4">4 Core</option>
                                    <option value="6">6 Core</option>
                                    <option value="8">8 Core</option>
                                    <option value="12">12 Core</option>
                                    <option value="24" selected>24 Core</option>
                                    <option value="48">48 Core</option>
                                    <option value="72">72 Core</option>
                                    <option value="96">96 Core</option>
                                    <option value="144">144 Core</option>
                                    <option value="216">216 Core</option>
                                    <option value="288">288 Core</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="coreUsed">Core yang Digunakan</label>
                                <input type="number" class="form-control" id="coreUsed" name="core_used" min="0" max="288">
                                <small class="form-text text-muted">Otomatis terisi dari perhitungan routing</small>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Core Tersedia</label>
                                <input type="text" class="form-control" id="coreAvailable" readonly>
                                <small class="form-text text-muted">Kapasitas Total - Core Digunakan</small>
                            </div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="splitterMain">Splitter Jaringan Utama</label>
                                <select class="form-control" id="splitterMain" name="splitter_main_id">
                                    <option value="">Pilih Splitter Utama</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="splitterOdp">Splitter ODP</label>
                                <select class="form-control" id="splitterOdp" name="splitter_odp_id">
                                    <option value="">Pilih Splitter ODP</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="itemStatus">Status</label>
                        <select class="form-control" id="itemStatus" name="status">
                            <option value="active">Aktif</option>
                            <option value="inactive">Tidak Aktif</option>
                            <option value="maintenance">Maintenance</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Batal</button>
                    <button type="submit" class="btn btn-primary">Simpan</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- jQuery -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<!-- Bootstrap 4 -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js"></script>
<!-- AdminLTE App -->
<script src="https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/js/adminlte.min.js"></script>
<!-- Leaflet JS (Latest Version) -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<!-- Leaflet Fullscreen Plugin -->
<script src="https://unpkg.com/leaflet-fullscreen@1.0.1/dist/leaflet.fullscreen.js"></script>
<!-- Leaflet Routing Machine -->
<script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
<!-- JSZip for KMZ compression and import -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
<!-- FileSaver for download -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
<!-- Custom JS -->
<script src="assets/js/map.js?v=<?php echo time(); ?>"></script>
<script src="assets/js/app.js?v=<?php echo time(); ?>"></script>
<script src="assets/js/kmz-export.js?v=<?php echo time(); ?>"></script>
<script src="assets/js/kmz-import.js?v=<?php echo time(); ?>"></script>

<script>
// Setup global AJAX defaults for all requests
$.ajaxSetup({
    xhrFields: {
        withCredentials: true
    },
    beforeSend: function(xhr, settings) {
        // Always send credentials for same-origin requests
        if (!settings.crossDomain) {
            xhr.withCredentials = true;
        }
    }
});

// Global variables for user session
const currentUser = {
    id: <?php echo $_SESSION['user_id']; ?>,
    username: '<?php echo htmlspecialchars($_SESSION['username']); ?>',
    role: '<?php echo htmlspecialchars($_SESSION['role']); ?>',
    fullName: '<?php echo htmlspecialchars($user_name); ?>',
    isAdmin: <?php echo $is_admin ? 'true' : 'false'; ?>
};

// Authentication functions
function logout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        $.ajax({
            url: 'api/auth.php?action=logout',
            method: 'POST',
            dataType: 'json',
            success: function(response) {
                alert('Logout berhasil!');
                window.location.href = 'login.php';
            },
            error: function(xhr, status, error) {
                console.error('Logout error:', error);
                // Force redirect even if logout fails
                window.location.href = 'login.php';
            }
        });
    }
}

function showProfile() {
    alert('Fitur profil akan segera tersedia');
}

function showUserManagement() {
    if (!currentUser.isAdmin) {
        alert('Akses ditolak: Fitur ini hanya untuk admin');
        return;
    }
    window.location.href = 'users.php';
}

// Role-based permission checking
function checkAdminPermission(action = 'melakukan aksi ini') {
    if (!currentUser.isAdmin) {
        alert(`Akses ditolak: Hanya admin yang dapat ${action}`);
        return false;
    }
    return true;
}

// Override functions that require admin permission
if (!currentUser.isAdmin) {
    // Disable admin-only functions for teknisi
    const originalShowAddItemModal = window.showAddItemModal;
    window.showAddItemModal = function() {
        checkAdminPermission('menambah item baru');
    };
    
    const originalShowRoutingMode = window.showRoutingMode;
    window.showRoutingMode = function() {
        checkAdminPermission('menggunakan mode routing');
    };
    
    const originalShowImportKMZModal = window.showImportKMZModal;
    window.showImportKMZModal = function() {
        checkAdminPermission('import KMZ');
    };
    
    const originalAddNewItem = window.addNewItem;
    window.addNewItem = function() {
        checkAdminPermission('menambah item baru');
    };
}

// Session timeout warning (30 minutes)
let sessionTimeout;
function resetSessionTimeout() {
    clearTimeout(sessionTimeout);
    sessionTimeout = setTimeout(function() {
        if (confirm('Sesi Anda akan berakhir dalam 5 menit. Ingin melanjutkan?')) {
            // Reset timeout for another 30 minutes
            resetSessionTimeout();
        } else {
            logout();
        }
    }, 25 * 60 * 1000); // 25 minutes (warn 5 minutes before expiry)
}

// Start session timeout
resetSessionTimeout();

// Reset timeout on user activity
$(document).on('click keypress mousemove', function() {
    resetSessionTimeout();
});

console.log('🔐 FTTH Planner V1.5 - Authenticated as:', currentUser.role.toUpperCase());

// Function to check session before making API calls
function checkSessionAndCall(callback) {
    $.ajax({
        url: 'api/auth.php?action=check',
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.authenticated) {
                console.log('✅ Session verified, calling callback');
                callback();
            } else {
                console.warn('❌ Session not authenticated, redirecting to login');
                window.location.href = 'login.php';
            }
        },
        error: function(xhr, status, error) {
            console.error('Session check failed:', error);
            if (xhr.status === 401 || xhr.status === 403) {
                window.location.href = 'login.php';
            } else {
                // Proceed anyway for network errors
                callback();
            }
        }
    });
}

// Enhanced loadItems with session check
function safeLoadItems() {
    checkSessionAndCall(function() {
        if (typeof loadItems === 'function') {
            loadItems();
        }
    });
}
</script>

</body>
</html>