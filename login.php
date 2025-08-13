<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>FTTH Planner | Login</title>

    <!-- Google Font: Source Sans Pro -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700&display=fallback">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <!-- AdminLTE -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/css/adminlte.min.css">
    
    <style>
        .login-page {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .login-card-body {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 2rem;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
        }
        
        .login-logo {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .login-logo .brand-text {
            color: #495057;
            font-size: 2rem;
            font-weight: 600;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        
        .login-logo i {
            font-size: 3rem;
            color: #667eea;
            margin-bottom: 1rem;
            display: block;
        }
        
        .input-group-text {
            background: rgba(102, 126, 234, 0.1);
            border-color: rgba(102, 126, 234, 0.3);
            color: #667eea;
        }
        
        .form-control {
            border-color: rgba(102, 126, 234, 0.3);
            border-radius: 10px;
        }
        
        .form-control:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }
        
        .btn-login {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 10px;
            font-weight: 600;
            padding: 12px;
            transition: all 0.3s ease;
        }
        
        .btn-login:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }
        
        .alert {
            border-radius: 10px;
            border: none;
        }
        
        .role-info {
            background: rgba(102, 126, 234, 0.1);
            border-radius: 10px;
            padding: 1rem;
            margin-bottom: 1rem;
            border-left: 4px solid #667eea;
        }
        
        .demo-accounts {
            font-size: 0.9rem;
            color: #6c757d;
        }
    </style>
</head>
<body class="hold-transition login-page">
<div class="login-box">
    <div class="login-logo">
        <i class="fas fa-network-wired"></i>
        <span class="brand-text">FTTH Planner</span>
    </div>
    
    <div class="card elevation-4">
        <div class="card-body login-card-body">
            <p class="login-box-msg">Masuk untuk memulai sesi Anda</p>
            
            <!-- Alert Messages -->
            <div id="alertContainer"></div>
            
            <!-- Demo Account Info -->
            <div class="role-info">
                <h6><i class="fas fa-info-circle text-primary"></i> Akun Demo:</h6>
                <div class="demo-accounts">
                    <strong>Admin:</strong> admin / password<br>
                    <strong>Teknisi:</strong> teknisi1 / password
                </div>
            </div>
            
            <form id="loginForm">
                <div class="input-group mb-3">
                    <input type="text" class="form-control" placeholder="Username" id="username" name="username" required autocomplete="username">
                    <div class="input-group-append">
                        <div class="input-group-text">
                            <span class="fas fa-user"></span>
                        </div>
                    </div>
                </div>
                
                <div class="input-group mb-3">
                    <input type="password" class="form-control" placeholder="Password" id="password" name="password" required autocomplete="current-password">
                    <div class="input-group-append">
                        <div class="input-group-text">
                            <span class="fas fa-lock"></span>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-8">
                        <div class="icheck-primary">
                            <input type="checkbox" id="remember" name="remember">
                            <label for="remember">
                                Ingat saya
                            </label>
                        </div>
                    </div>
                    <div class="col-4">
                        <button type="submit" class="btn btn-primary btn-block btn-login" id="loginBtn">
                            <span id="loginBtnText">Masuk</span>
                            <span id="loginSpinner" class="spinner-border spinner-border-sm d-none" role="status"></span>
                        </button>
                    </div>
                </div>
            </form>
            
            <div class="mt-4 text-center">
                <small class="text-muted">
                    <i class="fas fa-shield-alt"></i>
                    Sistem keamanan dengan role-based access control
                </small>
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

<script>
$(document).ready(function() {
    // Check if already logged in
    checkAuthStatus();
    
    // Handle login form submission
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        handleLogin();
    });
    
    // Enter key handler for quick login
    $('#username, #password').on('keypress', function(e) {
        if (e.which === 13) { // Enter key
            handleLogin();
        }
    });
});

function checkAuthStatus() {
    $.ajax({
        url: 'api/auth.php?action=check',
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.authenticated) {
                // Already logged in, redirect to dashboard
                window.location.href = 'index.php';
            }
        },
        error: function(xhr, status, error) {
            console.log('Auth check failed:', error);
        }
    });
}

function handleLogin() {
    const username = $('#username').val().trim();
    const password = $('#password').val();
    
    if (!username || !password) {
        showAlert('danger', 'Username dan password harus diisi!');
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    
    $.ajax({
        url: 'api/auth.php?action=login',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            username: username,
            password: password
        }),
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                showAlert('success', 'Login berhasil! Mengalihkan ke dashboard...');
                
                // Store user info in sessionStorage for quick access
                sessionStorage.setItem('user', JSON.stringify(response.user));
                
                // Redirect after short delay
                setTimeout(function() {
                    window.location.href = 'index.php';
                }, 1500);
            } else {
                showAlert('danger', response.message || 'Login gagal!');
                setLoadingState(false);
            }
        },
        error: function(xhr, status, error) {
            let errorMessage = 'Terjadi kesalahan pada server';
            
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage = xhr.responseJSON.message;
            } else if (xhr.status === 401) {
                errorMessage = 'Username atau password salah';
            } else if (xhr.status === 0) {
                errorMessage = 'Tidak dapat terhubung ke server';
            }
            
            showAlert('danger', errorMessage);
            setLoadingState(false);
        }
    });
}

function setLoadingState(loading) {
    const loginBtn = $('#loginBtn');
    const loginBtnText = $('#loginBtnText');
    const loginSpinner = $('#loginSpinner');
    
    if (loading) {
        loginBtn.prop('disabled', true);
        loginBtnText.text('Memproses...');
        loginSpinner.removeClass('d-none');
    } else {
        loginBtn.prop('disabled', false);
        loginBtnText.text('Masuk');
        loginSpinner.addClass('d-none');
    }
}

function showAlert(type, message) {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
            ${message}
            <button type="button" class="close" data-dismiss="alert">
                <span>&times;</span>
            </button>
        </div>
    `;
    
    $('#alertContainer').html(alertHtml);
    
    // Auto dismiss success alerts
    if (type === 'success') {
        setTimeout(function() {
            $('.alert').alert('close');
        }, 3000);
    }
}

// Demo account quick login buttons (for development)
function quickLogin(username, password) {
    $('#username').val(username);
    $('#password').val(password);
    handleLogin();
}
</script>

</body>
</html>