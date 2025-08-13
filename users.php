<?php
session_start();

// Check if user is logged in and is admin
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit();
}

if ($_SESSION['role'] !== 'admin') {
    header('Location: index.php');
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
    <title>FTTH Planner | Management User</title>

    <!-- Google Font: Source Sans Pro -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700&display=fallback">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <!-- AdminLTE -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/css/adminlte.min.css">
    <!-- DataTables -->
    <link rel="stylesheet" href="https://cdn.datatables.net/1.13.7/css/dataTables.bootstrap4.min.css">
    <!-- Custom CSS -->
    <link rel="stylesheet" href="assets/css/custom.css?v=<?php echo time(); ?>">
    
    <style>
        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            font-size: 14px;
        }
        
        .role-badge {
            font-size: 11px;
            padding: 4px 8px;
        }
        
        .status-badge {
            font-size: 11px;
            padding: 4px 8px;
        }
        
        .action-buttons .btn {
            padding: 4px 8px;
            font-size: 12px;
            margin: 0 2px;
        }
        
        .user-stats {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 15px;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .user-stats .stat-item {
            text-align: center;
        }
        
        .user-stats .stat-number {
            font-size: 2rem;
            font-weight: bold;
            display: block;
        }
        
        .user-stats .stat-label {
            font-size: 0.9rem;
            opacity: 0.9;
        }
    </style>
</head>
<body class="hold-transition sidebar-mini layout-fixed">
<div class="wrapper">

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
            <li class="nav-item d-none d-sm-inline-block">
                <a href="users.php" class="nav-link">Management User</a>
            </li>
        </ul>

        <!-- Right navbar links -->
        <ul class="navbar-nav ml-auto">
            <!-- User Dropdown Menu -->
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown">
                    <i class="fas fa-user-circle"></i>
                    <span class="d-none d-sm-inline"><?php echo htmlspecialchars($user_name); ?></span>
                    <span class="badge badge-danger ml-1">Admin</span>
                </a>
                <div class="dropdown-menu dropdown-menu-right">
                    <div class="dropdown-header">
                        <strong><?php echo htmlspecialchars($user_name); ?></strong><br>
                        <small class="text-muted"><?php echo htmlspecialchars($_SESSION['username']); ?></small>
                    </div>
                    <div class="dropdown-divider"></div>
                    <a class="dropdown-item" href="index.php">
                        <i class="fas fa-map mr-2"></i>Dashboard
                    </a>
                    <a class="dropdown-item" href="users.php">
                        <i class="fas fa-users mr-2"></i>Management User
                    </a>
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
            <span class="brand-text font-weight-light">FTTH Planner</span>
        </a>

        <!-- Sidebar -->
        <div class="sidebar">
            <!-- Sidebar Menu -->
            <nav class="mt-2">
                <ul class="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
                    <li class="nav-item">
                        <a href="index.php" class="nav-link">
                            <i class="nav-icon fas fa-map"></i>
                            <p>Dashboard FTTH</p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="users.php" class="nav-link active">
                            <i class="nav-icon fas fa-users"></i>
                            <p>Management User</p>
                        </a>
                    </li>
                    <li class="nav-header">APLIKASI</li>
                    <li class="nav-item">
                        <a href="index.php" class="nav-link">
                            <i class="nav-icon fas fa-arrow-left text-info"></i>
                            <p>Kembali ke Dashboard</p>
                        </a>
                    </li>
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
                        <h1 class="m-0">Management User</h1>
                    </div>
                    <div class="col-sm-6">
                        <ol class="breadcrumb float-sm-right">
                            <li class="breadcrumb-item"><a href="index.php">Dashboard</a></li>
                            <li class="breadcrumb-item active">Management User</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main content -->
        <section class="content">
            <div class="container-fluid">
                
                <!-- User Statistics -->
                <div class="user-stats">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="stat-item">
                                <span class="stat-number" id="totalUsers">0</span>
                                <span class="stat-label">Total User</span>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-item">
                                <span class="stat-number" id="adminUsers">0</span>
                                <span class="stat-label">Admin</span>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-item">
                                <span class="stat-number" id="teknisiUsers">0</span>
                                <span class="stat-label">Teknisi</span>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-item">
                                <span class="stat-number" id="activeUsers">0</span>
                                <span class="stat-label">Aktif</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Users Table -->
                <div class="row">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">
                                    <i class="fas fa-users mr-1"></i>
                                    Daftar User Sistem
                                </h3>
                                <div class="card-tools">
                                    <button type="button" class="btn btn-primary btn-sm" onclick="showAddUserModal()">
                                        <i class="fas fa-plus"></i> Tambah User
                                    </button>
                                    <button type="button" class="btn btn-info btn-sm" onclick="refreshUserList()">
                                        <i class="fas fa-sync-alt"></i> Refresh
                                    </button>
                                </div>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table id="usersTable" class="table table-bordered table-striped">
                                        <thead>
                                            <tr>
                                                <th>Avatar</th>
                                                <th>Username</th>
                                                <th>Nama Lengkap</th>
                                                <th>Email</th>
                                                <th>Role</th>
                                                <th>Status</th>
                                                <th>Dibuat</th>
                                                <th>Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <!-- Data will be loaded via AJAX -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>

    <!-- Footer -->
    <footer class="main-footer">
        <strong>Copyright &copy; 2025 <a href="#">FTTH Planner</a> by Saputra Budi.</strong>
        Semua hak dilindungi undang-undang.
        <div class="float-right d-none d-sm-inline-block">
            <b>Versi</b> 2.0.0
        </div>
    </footer>
</div>

<!-- Add/Edit User Modal -->
<div class="modal fade" id="userModal" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title" id="userModalTitle">Tambah User</h4>
                <button type="button" class="close" data-dismiss="modal">
                    <span>&times;</span>
                </button>
            </div>
            <form id="userForm">
                <div class="modal-body">
                    <input type="hidden" id="userId" name="id">
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="username">Username <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="username" name="username" required>
                                <small class="form-text text-muted">Username harus unik</small>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="fullName">Nama Lengkap</label>
                                <input type="text" class="form-control" id="fullName" name="full_name">
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" class="form-control" id="email" name="email">
                    </div>

                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="password">Password <span class="text-danger" id="passwordRequired">*</span></label>
                                <input type="password" class="form-control" id="password" name="password">
                                <small class="form-text text-muted" id="passwordHelp">Minimal 6 karakter</small>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="confirmPassword">Konfirmasi Password <span class="text-danger" id="confirmPasswordRequired">*</span></label>
                                <input type="password" class="form-control" id="confirmPassword">
                                <small class="form-text text-muted">Ulangi password yang sama</small>
                            </div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="role">Role <span class="text-danger">*</span></label>
                                <select class="form-control" id="role" name="role" required>
                                    <option value="teknisi">Teknisi (Read-only)</option>
                                    <option value="admin">Admin (Full Access)</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="status">Status <span class="text-danger">*</span></label>
                                <select class="form-control" id="status" name="status" required>
                                    <option value="active">Aktif</option>
                                    <option value="inactive">Tidak Aktif</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="alert alert-info" role="alert">
                        <i class="fas fa-info-circle"></i>
                        <strong>Role Permission:</strong><br>
                        • <strong>Admin:</strong> Full access (CRUD) ke semua fitur<br>
                        • <strong>Teknisi:</strong> Read-only access, hanya bisa melihat data
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

<!-- Delete Confirmation Modal -->
<div class="modal fade" id="deleteModal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">Konfirmasi Hapus</h4>
                <button type="button" class="close" data-dismiss="modal">
                    <span>&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <p>Apakah Anda yakin ingin menghapus user <strong id="deleteUserName"></strong>?</p>
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    Aksi ini tidak dapat dibatalkan!
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Batal</button>
                <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Hapus</button>
            </div>
        </div>
    </div>
</div>

<!-- jQuery -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<!-- Bootstrap 4 -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js"></script>
<!-- AdminLTE App -->
<script src="https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/js/adminlte.min.js"></script>
<!-- DataTables -->
<script src="https://cdn.datatables.net/1.13.7/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.datatables.net/1.13.7/js/dataTables.bootstrap4.min.js"></script>

<script>
let usersTable;
let editingUserId = null;

$(document).ready(function() {
    initializeUsersTable();
    loadUsers();
    initializeEventListeners();
});

// Initialize DataTable
function initializeUsersTable() {
    usersTable = $('#usersTable').DataTable({
        responsive: true,
        pageLength: 25,
        order: [[6, 'desc']], // Order by created date
        columnDefs: [
            { orderable: false, targets: [0, 7] }, // Avatar and Actions columns
            { width: "60px", targets: [0] },
            { width: "120px", targets: [4, 5] },
            { width: "150px", targets: [7] }
        ],
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/id.json'
        }
    });
}

// Initialize event listeners
function initializeEventListeners() {
    // User form submission
    $('#userForm').on('submit', function(e) {
        e.preventDefault();
        saveUser();
    });
    
    // Modal events
    $('#userModal').on('hidden.bs.modal', function() {
        resetUserForm();
    });
    
    // Password confirmation validation
    $('#confirmPassword').on('keyup', function() {
        validatePasswordMatch();
    });
    
    $('#password').on('keyup', function() {
        validatePasswordMatch();
    });
}

// Load users from API
function loadUsers() {
    $.ajax({
        url: 'api/users.php',
        method: 'GET',
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        },
        success: function(response) {
            if (response.success) {
                displayUsers(response.data);
                updateUserStats(response.data);
            } else {
                showNotification('Error loading users: ' + response.message, 'error');
            }
        },
        error: function(xhr, status, error) {
            console.error('Load users error:', error);
            showNotification('Error loading users: ' + error, 'error');
        }
    });
}

// Display users in table
function displayUsers(users) {
    usersTable.clear();
    
    users.forEach(function(user) {
        const avatar = generateAvatar(user.full_name || user.username);
        const rolebadge = `<span class="badge badge-${user.role === 'admin' ? 'danger' : 'info'} role-badge">${user.role === 'admin' ? 'Admin' : 'Teknisi'}</span>`;
        const statusBadge = `<span class="badge badge-${user.status === 'active' ? 'success' : 'secondary'} status-badge">${user.status === 'active' ? 'Aktif' : 'Tidak Aktif'}</span>`;
        const createdDate = new Date(user.created_at).toLocaleDateString('id-ID');
        
        const actions = `
            <div class="action-buttons">
                <button class="btn btn-info btn-sm" onclick="editUser(${user.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id}, '${user.username}')" title="Hapus" ${user.id == <?php echo $_SESSION['user_id']; ?> ? 'disabled' : ''}>
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        usersTable.row.add([
            avatar,
            user.username,
            user.full_name || '-',
            user.email || '-',
            rolebadge,
            statusBadge,
            createdDate,
            actions
        ]);
    });
    
    usersTable.draw();
}

// Generate user avatar
function generateAvatar(name) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const initials = name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2);
    const color = colors[name.length % colors.length];
    
    return `<div class="user-avatar" style="background-color: ${color}">${initials}</div>`;
}

// Update user statistics
function updateUserStats(users) {
    const total = users.length;
    const admins = users.filter(u => u.role === 'admin').length;
    const teknisi = users.filter(u => u.role === 'teknisi').length;
    const active = users.filter(u => u.status === 'active').length;
    
    $('#totalUsers').text(total);
    $('#adminUsers').text(admins);
    $('#teknisiUsers').text(teknisi);
    $('#activeUsers').text(active);
}

// Show add user modal
function showAddUserModal() {
    editingUserId = null;
    $('#userModalTitle').text('Tambah User');
    $('#passwordRequired, #confirmPasswordRequired').show();
    $('#passwordHelp').text('Minimal 6 karakter');
    $('#password, #confirmPassword').prop('required', true);
    resetUserForm();
    $('#userModal').modal('show');
}

// Edit user
function editUser(userId) {
    editingUserId = userId;
    
    $.ajax({
        url: 'api/users.php',
        method: 'GET',
        data: { id: userId },
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        },
        success: function(response) {
            if (response.success && response.data) {
                const user = response.data;
                
                $('#userModalTitle').text('Edit User');
                $('#userId').val(user.id);
                $('#username').val(user.username);
                $('#fullName').val(user.full_name);
                $('#email').val(user.email);
                $('#role').val(user.role);
                $('#status').val(user.status);
                
                // Password not required for edit
                $('#passwordRequired, #confirmPasswordRequired').hide();
                $('#passwordHelp').text('Kosongkan jika tidak ingin mengubah password');
                $('#password, #confirmPassword').prop('required', false);
                
                $('#userModal').modal('show');
            }
        },
        error: function() {
            showNotification('Error loading user data', 'error');
        }
    });
}

// Save user (create or update)
function saveUser() {
    const method = editingUserId ? 'PUT' : 'POST';
    
    // Validate required fields
    if (!$('#username').val()) {
        showNotification('Username harus diisi', 'warning');
        return;
    }
    
    // Validate password for new user
    if (!editingUserId && !$('#password').val()) {
        showNotification('Password harus diisi untuk user baru', 'warning');
        return;
    }
    
    // Validate password match
    if ($('#password').val() && $('#password').val() !== $('#confirmPassword').val()) {
        showNotification('Password dan konfirmasi password tidak sama', 'warning');
        return;
    }
    
    // Validate password length
    if ($('#password').val() && $('#password').val().length < 6) {
        showNotification('Password minimal 6 karakter', 'warning');
        return;
    }
    
    let formData = new FormData($('#userForm')[0]);
    
    if (method === 'PUT') {
        formData.append('_method', 'PUT');
        if (editingUserId) {
            formData.set('id', editingUserId);
        }
        
        // Remove password if empty (don't update password)
        if (!$('#password').val()) {
            formData.delete('password');
        }
    }
    
    $.ajax({
        url: 'api/users.php',
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        },
        success: function(response) {
            if (response.success) {
                $('#userModal').modal('hide');
                loadUsers(); // Reload users list
                showNotification(response.message || 'User berhasil disimpan', 'success');
            } else {
                showNotification(response.message || 'Error saving user', 'error');
            }
        },
        error: function(xhr, status, error) {
            console.error('Save user error:', error, xhr.responseText);
            showNotification('Error saving user: ' + error, 'error');
        }
    });
}

// Delete user
function deleteUser(userId, username) {
    if (userId == <?php echo $_SESSION['user_id']; ?>) {
        showNotification('Tidak dapat menghapus akun sendiri', 'warning');
        return;
    }
    
    $('#deleteUserName').text(username);
    $('#deleteModal').modal('show');
    
    $('#confirmDeleteBtn').off('click').on('click', function() {
        $.ajax({
            url: 'api/users.php',
            method: 'POST',
            data: {
                _method: 'DELETE',
                id: userId
            },
            dataType: 'json',
            xhrFields: {
                withCredentials: true
            },
            success: function(response) {
                $('#deleteModal').modal('hide');
                if (response.success) {
                    loadUsers(); // Reload users list
                    showNotification(response.message || 'User berhasil dihapus', 'success');
                } else {
                    showNotification(response.message || 'Error deleting user', 'error');
                }
            },
            error: function(xhr, status, error) {
                $('#deleteModal').modal('hide');
                console.error('Delete user error:', error);
                showNotification('Error deleting user: ' + error, 'error');
            }
        });
    });
}

// Reset user form
function resetUserForm() {
    $('#userForm')[0].reset();
    $('#userId').val('');
    $('#password, #confirmPassword').removeClass('is-invalid is-valid');
    editingUserId = null;
}

// Validate password match
function validatePasswordMatch() {
    const password = $('#password').val();
    const confirmPassword = $('#confirmPassword').val();
    
    if (confirmPassword && password !== confirmPassword) {
        $('#confirmPassword').addClass('is-invalid').removeClass('is-valid');
    } else if (confirmPassword) {
        $('#confirmPassword').addClass('is-valid').removeClass('is-invalid');
    } else {
        $('#confirmPassword').removeClass('is-invalid is-valid');
    }
}

// Refresh users list
function refreshUserList() {
    loadUsers();
    showNotification('Daftar user telah diperbarui', 'info');
}

// Show notification
function showNotification(message, type = 'info') {
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type] || 'alert-info';
    
    const notification = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert" style="position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
            ${message}
            <button type="button" class="close" data-dismiss="alert">
                <span>&times;</span>
            </button>
        </div>
    `;
    
    $('body').append(notification);
    
    // Auto remove after 5 seconds
    setTimeout(function() {
        $('.alert').fadeOut();
    }, 5000);
}

// Logout function
function logout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        $.ajax({
            url: 'api/auth.php?action=logout',
            method: 'POST',
            dataType: 'json',
            xhrFields: {
                withCredentials: true
            },
            success: function(response) {
                window.location.href = 'login.php';
            },
            error: function(xhr, status, error) {
                // Force redirect even if logout fails
                window.location.href = 'login.php';
            }
        });
    }
}
</script>

</body>
</html>