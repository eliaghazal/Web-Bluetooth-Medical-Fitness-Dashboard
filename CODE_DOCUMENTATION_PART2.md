# Code Documentation - Part 2: Views, JavaScript, CSS & Q&A

---

# Razor Views (CSHTML) Line-by-Line

## 1. _Layout.cshtml - Master Template (104 lines)

```html
<!DOCTYPE html>  <!-- HTML5 document type -->
<html lang="en">
<head>
    <meta charset="utf-8" />  <!-- Character encoding -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- Cache Control - Prevents browser caching -->
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    
    <!-- Dynamic title from ViewData -->
    <title>@ViewData["Title"] - HealthDashboard</title>
    
    <!-- Google Fonts - Premium Inter font -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Bootstrap CSS framework -->
    <link rel="stylesheet" href="~/lib/bootstrap/dist/css/bootstrap.min.css" />
    
    <!-- Font Awesome icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
    
    <!-- Custom CSS files -->
    <link rel="stylesheet" href="~/css/site.css" asp-append-version="true" />
    <link rel="stylesheet" href="~/css/dashboard.css" asp-append-version="true" />
    <!-- asp-append-version adds ?v=hash for cache busting -->
</head>
<body>
    <header>
        <!-- Bootstrap navbar with dark theme -->
        <nav class="navbar navbar-expand-sm navbar-dark bg-primary">
            <div class="container-fluid">
                <!-- Brand/Logo with Tag Helper -->
                <a class="navbar-brand" asp-controller="Home" asp-action="Index">
                    <i class="fas fa-heartbeat"></i> Health Dashboard
                </a>
                
                <!-- Mobile hamburger menu -->
                <button class="navbar-toggler" type="button" 
                        data-bs-toggle="collapse" 
                        data-bs-target=".navbar-collapse">
                    <span class="navbar-toggler-icon"></span>
                </button>
                
                <div class="navbar-collapse collapse d-sm-inline-flex justify-content-between">
                    <!-- Left navigation links -->
                    <ul class="navbar-nav flex-grow-1">
                        <li class="nav-item">
                            <a class="nav-link" asp-controller="Home" asp-action="Index">
                                <i class="fas fa-home"></i> Dashboard
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" asp-controller="Health" asp-action="Index">
                                <i class="fas fa-chart-line"></i> Health Data
                            </a>
                        </li>
                    </ul>
                    
                    <!-- Right side - User info/auth -->
                    <ul class="navbar-nav">
                        <!-- Razor conditional: Check if user is authenticated -->
                        @if (User.Identity?.IsAuthenticated == true)
                        {
                            <li class="nav-item">
                                <!-- Display current user's email -->
                                <span class="nav-link" data-user-email="@User.Identity.Name">
                                    <i class="fas fa-user"></i> @User.Identity.Name
                                </span>
                            </li>
                            <li class="nav-item">
                                <!-- Logout form (POST for security) -->
                                <form asp-controller="Account" asp-action="Logout" 
                                      method="post" id="logoutForm">
                                    <button type="submit" class="btn btn-link nav-link">
                                        <i class="fas fa-sign-out-alt"></i> Logout
                                    </button>
                                </form>
                            </li>
                        }
                        else
                        {
                            <li class="nav-item">
                                <a class="nav-link" asp-controller="Account" asp-action="Login">
                                    <i class="fas fa-sign-in-alt"></i> Login
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" asp-controller="Account" asp-action="Register">
                                    <i class="fas fa-user-plus"></i> Sign Up
                                </a>
                            </li>
                        }
                    </ul>
                </div>
            </div>
        </nav>
    </header>
    
    <div class="container-fluid">
        <main role="main" class="pb-3">
            @RenderBody()  <!-- Child page content inserted here -->
        </main>
    </div>

    <footer class="footer text-muted bg-light">
        <div class="container">
            &copy; 2026 - Medical/Fitness Health Dashboard
        </div>
    </footer>
    
    <!-- jQuery library (required for AJAX and animations) -->
    <script src="~/lib/jquery/dist/jquery.min.js"></script>
    <!-- jQuery Animate Enhanced plugin -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-animate-enhanced/1.1.1/jquery.animate-enhanced.min.js"></script>
    <!-- Bootstrap JavaScript bundle -->
    <script src="~/lib/bootstrap/dist/js/bootstrap.bundle.min.js"></script>
    <!-- Custom site script -->
    <script src="~/js/site.js" asp-append-version="true"></script>
    <!-- Auth protection (back button prevention) -->
    <script src="~/js/auth-protection.js" asp-append-version="true"></script>
    
    <!-- Optional scripts section for child pages -->
    @await RenderSectionAsync("Scripts", required: false)
</body>
</html>
```

---

## 2. Home/Index.cshtml - Main Dashboard (287 lines)

```html
@model HealthDashboard.Models.HealthDashboardViewModel
<!-- @model directive: Specifies the ViewModel type for IntelliSense -->

@{
    ViewData["Title"] = "Health Dashboard";  <!-- Sets page title -->
}

<div class="container-fluid">
    <!-- Page Header -->
    <div class="row">
        <div class="col-12">
            <h1 class="display-4 text-center mb-4">
                <i class="fas fa-heartbeat"></i> Medical/Fitness Dashboard
            </h1>
        </div>
    </div>

    <!-- SECTION 1: Web Bluetooth Device Connection -->
    <div class="row mb-4">
        <div class="col-md-12">
            <div class="card shadow">
                <div class="card-header bg-primary text-white">
                    <h3><i class="fas fa-bluetooth"></i> Web Bluetooth Devices</h3>
                </div>
                <div class="card-body">
                    <!-- Button Group for device connections -->
                    <div class="btn-group mb-3" role="group">
                        <button type="button" class="btn btn-success" id="connectHeartRate">
                            <i class="fas fa-heart"></i> Connect Heart Rate Monitor
                        </button>
                        <button type="button" class="btn btn-info" id="connectThermometer">
                            <i class="fas fa-thermometer-half"></i> Connect Thermometer
                        </button>
                        <button type="button" class="btn btn-warning" id="connectESP32">
                            <i class="fas fa-microchip"></i> Connect ESP32 Device
                        </button>
                        <button type="button" class="btn btn-danger" id="disconnectAll">
                            <i class="fas fa-times"></i> Disconnect All
                        </button>
                    </div>
                    <!-- Connection status (updated by JavaScript) -->
                    <div id="connectionStatus" class="alert alert-info">
                        No devices connected. Click a button above to connect.
                    </div>
                    <div id="connectedDevices"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- SECTION 2: Apple Watch HealthKit Data -->
    <div class="row mb-4">
        <div class="col-md-12">
            <div class="card shadow">
                <div class="card-header bg-dark text-white">
                    <h3><i class="fab fa-apple"></i> Apple Watch (HealthKit Sync)</h3>
                </div>
                <div class="card-body">
                    <div class="row">
                        <!-- Heart Rate Card -->
                        <div class="col-md-4">
                            <div class="card stat-card" id="watchHeartRateCard">
                                <div class="card-body text-center">
                                    <h5 class="card-title">
                                        <i class="fas fa-heartbeat"></i> Heart Rate
                                    </h5>
                                    <!-- Value updated by apple-watch.js -->
                                    <h2 id="watchHeartRateValue" class="display-3 text-danger">--</h2>
                                    <p class="text-muted">BPM (HealthKit)</p>
                                </div>
                            </div>
                        </div>
                        <!-- Temperature Card -->
                        <div class="col-md-4">
                            <div class="card stat-card" id="watchTempCard">
                                <div class="card-body text-center">
                                    <h5 class="card-title">
                                        <i class="fas fa-thermometer-half"></i> Wrist Temp
                                    </h5>
                                    <h2 id="watchTempValue" class="display-3 text-warning">--</h2>
                                    <p class="text-muted">°C (Sleep Data)</p>
                                </div>
                            </div>
                        </div>
                        <!-- Last Sync Card -->
                        <div class="col-md-4">
                            <div class="card stat-card" id="watchSyncCard">
                                <div class="card-body text-center">
                                    <h5 class="card-title">
                                        <i class="fas fa-sync"></i> Last Sync
                                    </h5>
                                    <h4 id="watchLastSync" class="display-5 text-primary">--</h4>
                                    <p class="text-muted">via iOS App</p>
                                    <button class="btn btn-sm btn-outline-primary mt-2" id="refreshWatchData">
                                        <i class="fas fa-sync-alt"></i> Refresh Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- SECTION 3: Live Bluetooth Data Display -->
    <div class="row mb-4">
        <div class="col-md-4">
            <div class="card shadow stat-card" id="heartRateCard">
                <div class="card-body text-center">
                    <h5 class="card-title"><i class="fas fa-heartbeat"></i> Heart Rate</h5>
                    <h2 id="heartRateValue" class="display-3 text-danger">--</h2>
                    <p class="text-muted">BPM</p>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card shadow stat-card" id="temperatureCard">
                <div class="card-body text-center">
                    <h5 class="card-title"><i class="fas fa-thermometer-half"></i> Temperature</h5>
                    <h2 id="temperatureValue" class="display-3 text-warning">--</h2>
                    <p class="text-muted">°C</p>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card shadow stat-card" id="esp32Card">
                <div class="card-body text-center">
                    <h5 class="card-title"><i class="fas fa-microchip"></i> ESP32 Sensor</h5>
                    <h2 id="esp32Value" class="display-3 text-info">--</h2>
                    <p class="text-muted">Units</p>
                </div>
            </div>
        </div>
    </div>

    <!-- SECTION 4: Statistics (LINQ Aggregations) -->
    <div class="row mb-4">
        <div class="col-md-12">
            <div class="card shadow">
                <div class="card-header bg-success text-white">
                    <h3><i class="fas fa-chart-bar"></i> Statistics (LINQ Aggregations)</h3>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="stat-box">
                                <!-- @Model.TotalReadings - Access ViewModel property -->
                                <h4>@Model.TotalReadings</h4>
                                <p>Total Readings</p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-box">
                                <!-- Dictionary.Count property -->
                                <h4>@Model.ReadingsByDevice.Count</h4>
                                <p>Connected Devices</p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-box">
                                <!-- Null-conditional with fallback -->
                                <h4>@(Model.LastReadingTime?.ToString("HH:mm:ss") ?? "--")</h4>
                                <p>Last Reading</p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-box">
                                <h4>@Model.AveragesByType.Count</h4>
                                <p>Device Types</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- SECTION 5: Averages by Type (LINQ GroupBy Result) -->
    @if (Model.AveragesByType.Any())  <!-- Razor if statement -->
    {
        <div class="row mb-4">
            <div class="col-md-12">
                <div class="card shadow">
                    <div class="card-header bg-info text-white">
                        <h3><i class="fas fa-calculator"></i> Averages by Device Type (LINQ GroupBy)</h3>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <!-- @foreach - Loop through dictionary -->
                            @foreach (var avg in Model.AveragesByType)
                            {
                                <div class="col-md-4 mb-3">
                                    <div class="average-card">
                                        <h5>@avg.Key</h5>  <!-- Device type name -->
                                        <h3>@avg.Value.ToString("F2")</h3>  <!-- Average value -->
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }

    <!-- SECTION 6: Recent Readings Table -->
    <div class="row mb-4">
        <div class="col-md-12">
            <div class="card shadow">
                <div class="card-header bg-dark text-white">
                    <h3><i class="fas fa-list"></i> Recent Readings (Last 20)</h3>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-striped table-hover" id="readingsTable">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Device Type</th>
                                    <th>Device ID</th>
                                    <th>Value</th>
                                    <th>Unit</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach (var reading in Model.RecentReadings)
                                {
                                    <tr class="reading-row">
                                        <td>@reading.Timestamp.ToString("yyyy-MM-dd HH:mm:ss")</td>
                                        <td><span class="badge bg-primary">@reading.DeviceType</span></td>
                                        <td>@reading.DeviceId</td>
                                        <td><strong>@reading.Value.ToString("F2")</strong></td>
                                        <td>@reading.Unit</td>
                                        <td>@reading.Notes</td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- SECTION 7: Export Data -->
    <div class="row mb-4">
        <div class="col-md-12">
            <div class="card shadow">
                <div class="card-header bg-secondary text-white">
                    <h3><i class="fas fa-download"></i> Export Data</h3>
                </div>
                <div class="card-body">
                    <div class="btn-group" role="group">
                        <a href="/Health/ExportJson" class="btn btn-primary" target="_blank">
                            <i class="fas fa-file-code"></i> Export as JSON
                        </a>
                        <a href="/Health/ExportXml" class="btn btn-success" target="_blank">
                            <i class="fas fa-file-code"></i> Export as XML
                        </a>
                        <button type="button" class="btn btn-warning" id="loadAnalytics">
                            <i class="fas fa-chart-line"></i> View Analytics
                        </button>
                        <button type="button" class="btn btn-danger" id="clearData">
                            <i class="fas fa-trash"></i> Clear All Data
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Analytics Modal (Bootstrap) -->
<div class="modal fade" id="analyticsModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">
                    <i class="fas fa-chart-line"></i> Analytics Dashboard
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" id="analyticsContent">
                <div class="text-center">
                    <div class="spinner-border" role="status"></div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Include page-specific scripts -->
@section Scripts {
    <script src="~/js/web-bluetooth.js"></script>
    <script src="~/js/dashboard.js"></script>
    <script src="~/js/apple-watch.js"></script>
}
```

---

## 3. Account/Login.cshtml (68 lines)

```html
@model HealthDashboard.Models.LoginViewModel
@{
    ViewData["Title"] = "Login";
}

<div class="container auth-page">
    <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
            <!-- Brand Header -->
            <div class="auth-brand">
                <i class="fas fa-heartbeat"></i>
                <span>Health Dashboard</span>
            </div>
            
            <div class="card shadow">
                <div class="card-header bg-primary text-white text-center">
                    <h3><i class="fas fa-sign-in-alt"></i> Login</h3>
                </div>
                <div class="card-body p-4">
                    <!-- Form with Tag Helpers -->
                    <form asp-action="Login" 
                          asp-route-returnUrl="@ViewData["ReturnUrl"]" 
                          method="post">
                        
                        <!-- Validation summary for model-level errors -->
                        <div asp-validation-summary="ModelOnly" 
                             class="alert alert-danger" role="alert"></div>
                        
                        <!-- Email field -->
                        <div class="mb-3">
                            <label asp-for="Email" class="form-label">
                                <i class="fas fa-envelope"></i> Email
                            </label>
                            <!-- asp-for generates name, id, value, validation attributes -->
                            <input asp-for="Email" class="form-control" 
                                   placeholder="Enter your email" 
                                   autocomplete="email" />
                            <!-- Validation message for this field -->
                            <span asp-validation-for="Email" class="text-danger"></span>
                        </div>
                        
                        <!-- Password field -->
                        <div class="mb-3">
                            <label asp-for="Password" class="form-label">
                                <i class="fas fa-lock"></i> Password
                            </label>
                            <input asp-for="Password" class="form-control" 
                                   placeholder="Enter your password" 
                                   autocomplete="current-password" />
                            <span asp-validation-for="Password" class="text-danger"></span>
                        </div>
                        
                        <!-- Remember me checkbox -->
                        <div class="mb-3 form-check">
                            <input asp-for="RememberMe" class="form-check-input" />
                            <label asp-for="RememberMe" class="form-check-label">
                                Remember me
                            </label>
                        </div>
                        
                        <!-- Submit button -->
                        <div class="d-grid gap-2">
                            <button type="submit" class="btn btn-primary btn-lg">
                                <i class="fas fa-sign-in-alt"></i> Login
                            </button>
                        </div>
                    </form>
                    
                    <hr />
                    
                    <!-- Link to registration -->
                    <div class="text-center">
                        <p class="mb-0">Don't have an account?</p>
                        <a asp-action="Register" 
                           asp-route-returnUrl="@ViewData["ReturnUrl"]" 
                           class="btn btn-outline-success">
                            <i class="fas fa-user-plus"></i> Sign Up
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

@section Scripts {
    <partial name="_ValidationScriptsPartial" />
    <script src="~/js/auth-pages.js" asp-append-version="true"></script>
}
```

---

# JavaScript Files Line-by-Line

## 1. web-bluetooth.js - Bluetooth API (275 lines)

```javascript
// Web Bluetooth API Implementation for Medical/Fitness Devices

class BluetoothHealthDevice {
    constructor() {
        // Map to store connected devices
        this.devices = new Map();
        // Check if Web Bluetooth API is available
        this.isBluetoothAvailable = 'bluetooth' in navigator;
    }

    // Connect to Heart Rate Monitor (Standard BLE Service)
    async connectHeartRateMonitor() {
        // Check browser support
        if (!this.isBluetoothAvailable) {
            alert('Web Bluetooth API is not available. Please use Chrome, Edge, or Opera.');
            return null;
        }

        try {
            console.log('Requesting Heart Rate Monitor...');
            
            // Request device with heart_rate service filter
            // This opens browser's device picker dialog
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['heart_rate'] }],  // Only show HR devices
                optionalServices: ['battery_service']      // Also request battery
            });

            console.log('Connecting to GATT Server...');
            // Connect to Generic Attribute Profile server
            const server = await device.gatt.connect();
            
            console.log('Getting Heart Rate Service...');
            // Get the heart rate service
            const service = await server.getPrimaryService('heart_rate');
            
            console.log('Getting Heart Rate Measurement Characteristic...');
            // Get the characteristic that provides measurements
            const characteristic = await service.getCharacteristic('heart_rate_measurement');
            
            // Start notifications (device will push data)
            await characteristic.startNotifications();
            
            // Listen for value changes
            characteristic.addEventListener('characteristicvaluechanged', (event) => {
                const value = this.parseHeartRate(event.target.value);
                this.handleHeartRateData(device.id, device.name, value);
            });

            // Store device info
            this.devices.set(device.id, { device, server, type: 'heart_rate' });
            this.updateConnectionStatus(`Connected to ${device.name || 'Heart Rate Monitor'}`, 'success');
            
            return device;
        } catch (error) {
            console.error('Heart Rate Monitor connection error:', error);
            this.updateConnectionStatus(`Failed to connect: ${error.message}`, 'danger');
            return null;
        }
    }

    // Parse Heart Rate data according to Bluetooth specification
    parseHeartRate(value) {
        // First byte contains flags
        const flags = value.getUint8(0);
        // Bit 0 indicates if HR is 8-bit or 16-bit
        const rate16Bits = flags & 0x1;
        let heartRate;
        
        if (rate16Bits) {
            // 16-bit heart rate value
            heartRate = value.getUint16(1, true);  // little-endian
        } else {
            // 8-bit heart rate value
            heartRate = value.getUint8(1);
        }
        
        return heartRate;
    }

    // Handle received heart rate data
    handleHeartRateData(deviceId, deviceName, value) {
        console.log(`Heart Rate: ${value} BPM`);
        
        // Update UI with jQuery animation
        $('#heartRateValue').text(value).hide().fadeIn(500);
        $('#heartRateCard').addClass('pulse-animation');
        setTimeout(() => $('#heartRateCard').removeClass('pulse-animation'), 500);
        
        // Send to ASP.NET server via AJAX
        this.sendReadingToServer({
            deviceId: deviceId,
            deviceType: 'heart_rate',
            value: value,
            unit: 'BPM',
            notes: `From ${deviceName || 'Heart Rate Monitor'}`
        });
    }

    // Send reading to server using jQuery AJAX
    sendReadingToServer(reading) {
        $.ajax({
            url: '/Health/AddReading',      // POST to HealthController.AddReading
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(reading),   // Convert to JSON string
            success: function(response) {
                console.log('Reading saved:', response);
                // Refresh the table if function exists
                if (typeof refreshReadingsTable === 'function') {
                    refreshReadingsTable();
                }
            },
            error: function(xhr, status, error) {
                console.error('Error saving reading:', error);
            }
        });
    }

    // Disconnect all devices
    disconnectAll() {
        this.devices.forEach((deviceInfo, deviceId) => {
            if (deviceInfo.server && deviceInfo.server.connected) {
                deviceInfo.server.disconnect();
            }
        });
        this.devices.clear();
        
        // Reset UI values
        $('#heartRateValue').text('--');
        $('#temperatureValue').text('--');
        $('#esp32Value').text('--');
        $('#connectedDevices').empty();
        
        this.updateConnectionStatus('All devices disconnected', 'info');
    }

    // Update connection status with jQuery animation
    updateConnectionStatus(message, type) {
        const alertClass = `alert alert-${type}`;
        $('#connectionStatus')
            .removeClass()
            .addClass(alertClass)
            .text(message)
            .hide()
            .slideDown(300);
    }
}

// Create global instance
window.bluetoothDevice = new BluetoothHealthDevice();
```

---

## 2. dashboard.js - jQuery/AJAX (358 lines)

```javascript
// Dashboard JavaScript with jQuery
// Handles UI interactions, animations, and AJAX calls

$(document).ready(function() {
    console.log('Dashboard initialized with jQuery');

    // BUTTON: Connect Heart Rate
    $('#connectHeartRate').on('click', function() {
        // Disable button and show loading
        $(this).prop('disabled', true)
               .html('<i class="fas fa-spinner fa-spin"></i> Connecting...');

        // Call Bluetooth API method
        window.bluetoothDevice.connectHeartRateMonitor()
            .then(() => {
                // Re-enable button on success
                $(this).prop('disabled', false)
                       .html('<i class="fas fa-heart"></i> Connect Heart Rate Monitor');
            })
            .catch(() => {
                $(this).prop('disabled', false)
                       .html('<i class="fas fa-heart"></i> Connect Heart Rate Monitor');
            });
    });

    // BUTTON: Disconnect All
    $('#disconnectAll').on('click', function() {
        window.bluetoothDevice.disconnectAll();
        // jQuery animate - fade button
        $(this).animate({ opacity: 0.5 }, 200, function() {
            $(this).animate({ opacity: 1 }, 200);
        });
    });

    // BUTTON: Clear All Data
    $('#clearData').on('click', function() {
        if (confirm('Are you sure you want to clear all health data?')) {
            $.ajax({
                url: '/Health/ClearAllReadings',
                type: 'DELETE',
                success: function(response) {
                    showNotification('All data cleared successfully', 'success');
                    setTimeout(() => location.reload(), 1000);
                },
                error: function(xhr, status, error) {
                    showNotification('Error clearing data: ' + error, 'danger');
                }
            });
        }
    });

    // BUTTON: Load Analytics
    $('#loadAnalytics').on('click', function() {
        loadAnalyticsData();
    });

    // Auto-refresh readings every 10 seconds
    setInterval(function() {
        refreshReadingsTable();
    }, 10000);

    // Initial animations
    initializeAnimations();
});

// Refresh readings table via AJAX
function refreshReadingsTable() {
    $.ajax({
        url: '/Health/GetReadings',
        type: 'GET',
        success: function(readings) {
            if (readings && readings.length > 0) {
                updateReadingsTable(readings.slice(0, 20));
            }
        },
        error: function(xhr, status, error) {
            console.error('Error fetching readings:', error);
        }
    });
}

// Update table with jQuery animation
function updateReadingsTable(readings) {
    const tbody = $('#readingsTable tbody');
    
    // Fade out, update, fade in
    tbody.fadeOut(300, function() {
        tbody.empty();

        readings.forEach(function(reading) {
            const timestamp = new Date(reading.timestamp).toLocaleString();
            const row = $('<tr>').addClass('reading-row').hide();

            row.append($('<td>').text(timestamp));
            row.append($('<td>').html(`<span class="badge bg-primary">${reading.deviceType}</span>`));
            row.append($('<td>').text(reading.deviceId));
            row.append($('<td>').html(`<strong>${reading.value.toFixed(2)}</strong>`));
            row.append($('<td>').text(reading.unit));
            row.append($('<td>').text(reading.notes || ''));

            tbody.append(row);
        });

        tbody.fadeIn(300);
        
        // Stagger row animations
        tbody.find('tr').each(function(index) {
            $(this).delay(index * 50).fadeIn(200);
        });
    });
}

// Load analytics with jQuery AJAX
function loadAnalyticsData() {
    $('#analyticsModal').modal('show');
    $('#analyticsContent').html('<div class="text-center"><div class="spinner-border"></div></div>');

    $.ajax({
        url: '/Health/Analytics',
        type: 'GET',
        success: function(data) {
            displayAnalytics(data);
        },
        error: function(xhr, status, error) {
            $('#analyticsContent').html(`<div class="alert alert-danger">Error: ${error}</div>`);
        }
    });
}

// Show notification toast
function showNotification(message, type) {
    const notification = $('<div>')
        .addClass(`alert alert-${type} notification`)
        .html(`<i class="fas fa-info-circle"></i> ${message}`)
        .css({
            position: 'fixed',
            top: '80px',
            right: '20px',
            zIndex: 9999,
            minWidth: '300px',
            display: 'none'
        });

    $('body').append(notification);

    // Animate in, wait, animate out
    notification.slideDown(300).delay(3000).slideUp(300, function() {
        $(this).remove();
    });
}

// Initialize page load animations
function initializeAnimations() {
    // Animate stat cards sequentially
    $('.stat-card').each(function(index) {
        $(this).css({ opacity: 0, transform: 'translateY(20px)' });
        $(this).delay(index * 100).animate(
            { opacity: 1 },
            {
                duration: 500,
                step: function(now) {
                    $(this).css('transform', `translateY(${20 - (now * 20)}px)`);
                }
            }
        );
    });
}

// Export for use by web-bluetooth.js
window.refreshReadingsTable = refreshReadingsTable;
```

---

## 3. apple-watch.js - HealthKit Data (148 lines)

```javascript
/**
 * Apple Watch HealthKit Data Fetcher
 * Fetches data from /api/health/latest
 */
(function($) {
    'use strict';

    // Configuration
    var REFRESH_INTERVAL = 5000;  // 5 seconds
    var API_ENDPOINT = '/api/health/latest';

    // State
    var isRefreshing = false;
    var refreshTimer = null;

    // Fetch latest Apple Watch data
    function fetchWatchData() {
        if (isRefreshing) return;  // Prevent concurrent requests
        isRefreshing = true;

        // Show loading state
        var $refreshBtn = $('#refreshWatchData');
        var originalHtml = $refreshBtn.html();
        $refreshBtn.html('<i class="fas fa-spinner fa-spin"></i> Loading...')
                   .prop('disabled', true);

        $.ajax({
            url: API_ENDPOINT,
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                updateUI(data);
            },
            error: function(xhr, status, error) {
                console.error('Error fetching Apple Watch data:', error);
                showNoData();
            },
            complete: function() {
                isRefreshing = false;
                $refreshBtn.html(originalHtml).prop('disabled', false);
            }
        });
    }

    // Update UI with data
    function updateUI(data) {
        if (!data) {
            showNoData();
            return;
        }

        // Heart Rate
        if (data.heartRateBpm !== null && data.heartRateBpm !== undefined) {
            $('#watchHeartRateValue').text(Math.round(data.heartRateBpm));
            $('#watchHeartRateCard').removeClass('no-data');
        } else {
            $('#watchHeartRateValue').text('--');
            $('#watchHeartRateCard').addClass('no-data');
        }

        // Temperature
        if (data.hasTemperature && data.temperatureC !== null) {
            $('#watchTempValue').text(data.temperatureC.toFixed(1));
            $('#watchTempCard').removeClass('no-data');
        } else {
            $('#watchTempValue').text('N/A');
            $('#watchTempCard').addClass('no-data');
        }

        // Last Sync Time
        if (data.lastSyncUtc) {
            var syncTime = new Date(data.lastSyncUtc);
            var timeStr = syncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            $('#watchLastSync').text(timeStr);
        } else {
            $('#watchLastSync').text('Never');
        }
    }

    // Initialize
    function init() {
        // Bind refresh button
        $('#refreshWatchData').on('click', function(e) {
            e.preventDefault();
            fetchWatchData();
        });

        // Initial fetch
        fetchWatchData();

        // Start auto-refresh
        refreshTimer = setInterval(fetchWatchData, REFRESH_INTERVAL);

        // Pause when tab hidden
        $(document).on('visibilitychange', function() {
            if (document.hidden) {
                clearInterval(refreshTimer);
            } else {
                fetchWatchData();
                refreshTimer = setInterval(fetchWatchData, REFRESH_INTERVAL);
            }
        });
    }

    $(document).ready(init);
})(jQuery);
```

---

## 4. auth-protection.js - Security (230 lines)

```javascript
// Prevents back button access after logout
(function() {
    'use strict';

    // Prevent back navigation using History API
    function preventBackNavigation() {
        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, document.title, window.location.href);
        }

        if (window.history && window.history.pushState) {
            window.history.pushState(null, document.title, window.location.href);
        }

        // Listen for back button
        window.addEventListener('popstate', function(event) {
            window.history.pushState(null, document.title, window.location.href);
        });
    }

    // Handle Safari's back-forward cache
    function preventPageCaching() {
        window.addEventListener('pageshow', function(event) {
            if (event.persisted) {
                // Page from cache - force reload
                window.location.reload();
            }
        });
    }

    // Clear sensitive data
    function clearSensitiveData() {
        if (window.sessionStorage) {
            sessionStorage.clear();
        }
        document.querySelectorAll('form').forEach(function(form) {
            form.reset();
        });
    }

    // Block keyboard shortcuts for back
    function disableBackKeyboardShortcuts() {
        document.addEventListener('keydown', function(event) {
            // Backspace (not in input)
            if (event.key === 'Backspace') {
                var tagName = event.target.tagName.toLowerCase();
                if (tagName !== 'input' && tagName !== 'textarea') {
                    event.preventDefault();
                }
            }
            // Alt + Left Arrow
            if (event.altKey && event.key === 'ArrowLeft') {
                event.preventDefault();
            }
        });
    }

    // Initialize
    function initialize() {
        preventBackNavigation();
        preventPageCaching();
        disableBackKeyboardShortcuts();
        console.log('[Navigation Guard] Active');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
```

---

# Judge/Instructor Q&A Section

## LINQ Questions

**Q1: What is LINQ and why did you use it?**
> LINQ (Language Integrated Query) allows querying collections using C# syntax. I used it for:
> - Filtering readings by user: `.Where(r => r.UserId == userId)`
> - Grouping by device type: `.GroupBy(r => r.DeviceType)`
> - Calculating averages: `.Average(r => r.Value)`
> - Sorting: `.OrderByDescending(r => r.Timestamp)`

**Q2: Explain the GroupBy + Average in GetAveragesByType()**
```csharp
return _readings
    .Where(r => r.UserId == userId)    // 1. Filter by user
    .GroupBy(r => r.DeviceType)        // 2. Group readings by type
    .ToDictionary(
        g => g.Key,                    // 3. Key = device type name
        g => g.Average(r => r.Value)   // 4. Value = average of group
    );
```

**Q3: What's the difference between IEnumerable and List?**
> `IEnumerable` is lazy - executes when enumerated. `List` is eager - data in memory.  
> I use `.ToList()` to execute queries and store results.

---

## MVC Questions

**Q4: Explain the MVC pattern in your project**
> - **Model**: DTOs (`HealthReadingDto`), ViewModels (`HealthDashboardViewModel`)
> - **View**: Razor `.cshtml` files that render HTML
> - **Controller**: C# classes that handle HTTP requests, call services, return Views

**Q5: What is a ViewModel?**
> A class that contains exactly the data needed for a specific View. `HealthDashboardViewModel` combines recent readings, grouped readings, and averages.

**Q6: How does routing work?**
> Pattern: `{controller=Home}/{action=Index}/{id?}`
> - `/` → HomeController.Index()
> - `/Health/AddReading` → HealthController.AddReading()
> - `/Account/Login` → AccountController.Login()

---

## Authentication Questions

**Q7: How does user authentication work?**
> 1. User submits login form
> 2. `SignInManager.PasswordSignInAsync()` validates credentials
> 3. If successful, creates encrypted cookie with user info
> 4. Cookie sent with every request
> 5. `[Authorize]` attribute checks for valid cookie

**Q8: What is [ValidateAntiForgeryToken]?**
> Prevents CSRF (Cross-Site Request Forgery) attacks. Form includes hidden token that must match server-side token.

**Q9: How do you protect controllers?**
> Use `[Authorize]` attribute on controller or action. Users without valid auth cookie are redirected to login.

---

## JavaScript/jQuery Questions

**Q10: Why use jQuery instead of vanilla JavaScript?**
> jQuery provides simpler syntax for:
> - DOM selection: `$('#id')` vs `document.getElementById('id')`
> - AJAX: `$.ajax()` vs `fetch()` with more options
> - Animations: `.fadeIn()`, `.slideDown()`
> - Cross-browser compatibility

**Q11: Explain the AJAX call to AddReading**
```javascript
$.ajax({
    url: '/Health/AddReading',     // Controller endpoint
    type: 'POST',                  // HTTP method
    contentType: 'application/json', // Send as JSON
    data: JSON.stringify(reading),  // Convert object to JSON
    success: function(response) { } // Handle success
});
```

---

## Web Bluetooth Questions

**Q12: What is Web Bluetooth API?**
> Browser API for connecting to Bluetooth Low Energy (BLE) devices. Requires HTTPS and user gesture.

**Q13: How does device connection work?**
> 1. `navigator.bluetooth.requestDevice()` - User selects device
> 2. `device.gatt.connect()` - Connect to GATT server
> 3. `getPrimaryService('heart_rate')` - Get service
> 4. `getCharacteristic()` - Get data characteristic
> 5. `startNotifications()` - Subscribe to updates

---

## CSS Questions

**Q14: What CSS approach did you use?**
> CSS Custom Properties (variables) for theming:
```css
:root {
    --bg: #0f1419;
    --primary: #6366f1;
}
body { background: var(--bg); }
```

**Q15: How is the design responsive?**
> Bootstrap 5 grid: `col-md-4` = 4/12 columns on medium+ screens. Flexbox for alignment.

---

## Database Questions

**Q16: What database do you use?**
> SQLite with Entity Framework Core. The `ApplicationDbContext` inherits from `IdentityDbContext` which creates user/role tables.

**Q17: Why use in-memory storage for readings?**
> For demo purposes. Production would use Entity Framework with a `DbSet<HealthReading>` and proper database storage.

---

## Security Questions

**Q18: How do you prevent cached pages after logout?**
> 1. HTTP headers: `Cache-Control: no-store`
> 2. JavaScript: Push to history on popstate
> 3. Handle Safari's bfcache with `pageshow` event

**Q19: How is the password stored?**
> ASP.NET Identity hashes passwords with PBKDF2. Never stored in plain text.

---

## Architecture Questions

**Q20: Explain Dependency Injection in your project**
> Services registered in `Program.cs`:
```csharp
builder.Services.AddSingleton<HealthDataService>();
```
> Injected via constructor:
```csharp
public HomeController(HealthDataService service) {
    _service = service;
}
```

**Q21: What is the Singleton pattern?**
> Single instance shared by all requests. Used for `HealthDataService` to maintain in-memory data across requests.

---

## API Questions

**Q22: What is [ApiController]?**
> Enables API behaviors: automatic model validation, `[FromBody]` inference, problem details for errors.

**Q23: Difference between Controller and ControllerBase?**
> `Controller` supports Views. `ControllerBase` is for APIs only (no View methods).

---

## Razor Questions

**Q24: What are Tag Helpers?**
> Server-side processing of HTML elements:
> - `asp-for="Email"` → generates name, id, validation attributes
> - `asp-action="Login"` → generates URL
> - `asp-validation-for` → client-side validation message

**Q25: What does @RenderBody() do?**
> Placeholder in layout where child page content is inserted.

---

*End of Documentation*
