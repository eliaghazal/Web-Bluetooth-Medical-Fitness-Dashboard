# 🏥 Web Bluetooth Medical/Fitness Dashboard - Code Documentation

> **Final Project - Web Programming Course**  
> This document explains every file in the project for presentation to judges.

---

## 📁 Project Overview

This is an **ASP.NET Core MVC** web application that connects to Bluetooth health devices (heart rate monitors, thermometers, ESP32) and Apple Watch via HealthKit to display real-time health data.

### Technologies Used
| Technology | Purpose |
|------------|---------|
| **C# / ASP.NET Core 8** | Backend MVC framework |
| **Entity Framework Core** | Database ORM with SQLite |
| **ASP.NET Core Identity** | User authentication |
| **Razor Views (.cshtml)** | Server-side HTML rendering |
| **JavaScript / jQuery** | Client-side interactivity |
| **Web Bluetooth API** | Connect to BLE devices |
| **CSS3** | Premium dark theme styling |
| **Bootstrap 5** | Responsive grid layout |

---

## 🔧 C# Backend Files

### 1. `Program.cs` - Application Entry Point

**Purpose:** Configures and starts the ASP.NET Core application.

```csharp
var builder = WebApplication.CreateBuilder(args);

// Register services with Dependency Injection
builder.Services.AddControllersWithViews();
builder.Services.AddSingleton<HealthDataService>();  // Health data storage

// Configure SQLite Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite("Data Source=HealthDashboard.db"));

// Configure ASP.NET Core Identity for authentication
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequiredLength = 6;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>();

// Cookie settings for login
builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = "/Account/Login";
    options.ExpireTimeSpan = TimeSpan.FromHours(24);
});

var app = builder.Build();

// Middleware pipeline
app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();  // Check if user is logged in
app.UseAuthorization();   // Check permissions

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
```

**Key Concepts:**
- **Dependency Injection:** Services are registered and injected automatically
- **Middleware Pipeline:** Each request passes through Authentication → Authorization → Controller
- **MVC Pattern:** Routes map to Controller/Action

---

### 2. `Controllers/HomeController.cs` - Main Dashboard

**Purpose:** Handles the main dashboard page requests.

```csharp
[Authorize]  // Requires login to access
public class HomeController : Controller
{
    private readonly HealthDataService _healthDataService;
    private readonly UserManager<ApplicationUser> _userManager;

    // Dependency Injection via constructor
    public HomeController(HealthDataService healthDataService, 
                         UserManager<ApplicationUser> userManager)
    {
        _healthDataService = healthDataService;
        _userManager = userManager;
    }

    [ResponseCache(Duration = 0, NoStore = true)]  // No caching
    public IActionResult Index()
    {
        var userId = _userManager.GetUserId(User);  // Get current user
        var dashboardData = _healthDataService.GetDashboardData(userId);
        return View(dashboardData);  // Pass ViewModel to View
    }
}
```

**Key Concepts:**
- **`[Authorize]` Attribute:** Protects controller - redirects to login if not authenticated
- **`UserManager`:** ASP.NET Identity service for user operations
- **ViewModel Pattern:** Data is packaged in `HealthDashboardViewModel` for the View

---

### 3. `Controllers/HealthController.cs` - Health Data API

**Purpose:** RESTful API for health readings with **LINQ** demonstrations.

```csharp
[Authorize]
public class HealthController : Controller
{
    private string GetCurrentUserId() => _userManager.GetUserId(User) ?? "";

    // POST: Add new reading from Bluetooth device
    [HttpPost]
    public IActionResult AddReading([FromBody] HealthReadingDto reading)
    {
        if (ModelState.IsValid)
        {
            _healthDataService.AddReading(reading, GetCurrentUserId());
            return Json(new { success = true });
        }
        return Json(new { success = false });
    }

    // GET: Statistics using LINQ Aggregations
    [HttpGet]
    public IActionResult GetStatistics()
    {
        var allReadings = _healthDataService.GetAllReadings(GetCurrentUserId());
        
        var stats = new
        {
            TotalReadings = allReadings.Count,
            // LINQ Aggregation - Count readings in last 24 hours
            ReadingsLast24Hours = allReadings
                .Where(r => r.Timestamp >= DateTime.Now.AddHours(-24))
                .Count(),
            // LINQ Aggregation - Max/Min values
            MaxValue = allReadings.Any() ? allReadings.Max(r => r.Value) : 0,
            MinValue = allReadings.Any() ? allReadings.Min(r => r.Value) : 0
        };
        return Json(stats);
    }

    // GET: Export as XML using LINQ to XML
    [HttpGet]
    public IActionResult ExportXml()
    {
        var readings = _healthDataService.GetAllReadings(GetCurrentUserId());
        
        var xml = new XElement("HealthReadings",
            readings.Select(r => new XElement("Reading",
                new XElement("DeviceType", r.DeviceType),
                new XElement("Value", r.Value),
                new XElement("Timestamp", r.Timestamp.ToString("o"))
            ))
        );
        return Content(xml.ToString(), "application/xml");
    }

    // GET: Analytics with GroupBy
    [HttpGet]
    public IActionResult Analytics()
    {
        var allReadings = _healthDataService.GetAllReadings(GetCurrentUserId());
        
        var analytics = new
        {
            // LINQ GroupBy - Group readings by hour
            ReadingsByHour = allReadings
                .GroupBy(r => r.Timestamp.Hour)
                .Select(g => new { Hour = g.Key, Count = g.Count() })
                .OrderBy(x => x.Hour)
                .ToList(),
                
            // LINQ GroupBy with Aggregation
            RecentTrends = allReadings
                .Where(r => r.Timestamp >= DateTime.Now.AddHours(-24))
                .GroupBy(r => r.DeviceType)
                .Select(g => new 
                { 
                    Type = g.Key, 
                    Average = g.Average(r => r.Value),
                    Count = g.Count()
                })
                .ToList()
        };
        return Json(analytics);
    }
}
```

**LINQ Concepts Demonstrated:**
- **Where()** - Filter collections
- **Select()** - Transform/project data
- **GroupBy()** - Group data by property
- **Count(), Max(), Min(), Average()** - Aggregations
- **OrderBy()** - Sorting
- **ToList()** - Execute and materialize query

---

### 4. `Controllers/AccountController.cs` - Authentication

**Purpose:** Login, Register, and Logout functionality.

```csharp
public class AccountController : Controller
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;

    // GET: Show login page
    [HttpGet]
    public IActionResult Login(string? returnUrl = null)
    {
        if (User.Identity?.IsAuthenticated == true)
            return RedirectToAction("Index", "Home");
        return View();
    }

    // POST: Process login form
    [HttpPost]
    [ValidateAntiForgeryToken]  // CSRF protection
    public async Task<IActionResult> Login(LoginViewModel model)
    {
        if (ModelState.IsValid)
        {
            var result = await _signInManager.PasswordSignInAsync(
                model.Email, model.Password, model.RememberMe, false);

            if (result.Succeeded)
                return RedirectToLocal(returnUrl);
            
            ModelState.AddModelError("", "Invalid login attempt.");
        }
        return View(model);
    }

    // POST: Register new user
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Register(RegisterViewModel model)
    {
        if (ModelState.IsValid)
        {
            var user = new ApplicationUser
            {
                UserName = model.Email,
                Email = model.Email,
                FullName = model.FullName
            };

            var result = await _userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
            {
                await _signInManager.SignInAsync(user, false);
                return RedirectToAction("Index", "Home");
            }
        }
        return View(model);
    }

    // POST: Logout
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return RedirectToAction("Login");
    }
}
```

**Key Concepts:**
- **`[ValidateAntiForgeryToken]`** - Prevents Cross-Site Request Forgery attacks
- **`async/await`** - Asynchronous programming for database operations
- **`SignInManager`** - Handles cookie-based authentication

---

### 5. `Controllers/Api/WatchSyncController.cs` - REST API

**Purpose:** JSON API for iOS app to sync Apple Watch data.

```csharp
[ApiController]  // Enables API behavior
[Route("api/health")]
public class WatchSyncController : ControllerBase
{
    // POST /api/health/watch-sync
    [HttpPost("watch-sync")]
    [Authorize]
    public IActionResult WatchSync([FromBody] WatchSyncPayload payload)
    {
        var userId = _userManager.GetUserId(User);
        _healthDataService.SaveWatchData(userId, payload);
        
        return Ok(new WatchSyncResponse { Success = true });
    }

    // GET /api/health/latest
    [HttpGet("latest")]
    [Authorize]
    public IActionResult GetLatest()
    {
        var data = _healthDataService.GetLatestWatchData(userId);
        return Ok(data);
    }
}
```

---

### 6. `Services/HealthDataService.cs` - Business Logic

**Purpose:** Stores and retrieves health data using LINQ.

```csharp
public class HealthDataService
{
    private static List<HealthReadingDto> _readings = new();
    private static Dictionary<string, UserWatchData> _watchData = new();

    // Add reading with user isolation
    public void AddReading(HealthReadingDto reading, string userId)
    {
        reading.UserId = userId;
        reading.Timestamp = DateTime.Now;
        _readings.Add(reading);
    }

    // LINQ: Filter by user, order by timestamp
    public List<HealthReadingDto> GetAllReadings(string userId)
    {
        return _readings
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.Timestamp)
            .ToList();
    }

    // LINQ: GroupBy device, return Dictionary
    public Dictionary<string, List<HealthReadingDto>> GetReadingsGroupedByDevice(string userId)
    {
        return _readings
            .Where(r => r.UserId == userId)
            .GroupBy(r => r.DeviceId)
            .ToDictionary(g => g.Key, g => g.ToList());
    }

    // LINQ: GroupBy with Average aggregation
    public Dictionary<string, double> GetAveragesByType(string userId)
    {
        return _readings
            .Where(r => r.UserId == userId)
            .GroupBy(r => r.DeviceType)
            .ToDictionary(g => g.Key, g => g.Average(r => r.Value));
    }
}
```

---

### 7. DTOs and ViewModels (Data Transfer Objects)

**`Models/HealthReadingDto.cs`** - Individual health reading:
```csharp
public class HealthReadingDto
{
    public int Id { get; set; }
    public string UserId { get; set; }      // User isolation
    public string DeviceId { get; set; }    // BT001, AppleWatch
    public string DeviceType { get; set; }  // heart_rate, thermometer
    public double Value { get; set; }       // 72, 36.5
    public string Unit { get; set; }        // BPM, °C
    public DateTime Timestamp { get; set; }
}
```

**`Models/HealthDashboardViewModel.cs`** - Dashboard data package:
```csharp
public class HealthDashboardViewModel
{
    public List<HealthReadingDto> RecentReadings { get; set; }
    public Dictionary<string, List<HealthReadingDto>> ReadingsByDevice { get; set; }
    public Dictionary<string, double> AveragesByType { get; set; }  // LINQ result
    public int TotalReadings { get; set; }
    public DateTime? LastReadingTime { get; set; }
}
```

**`Models/LoginViewModel.cs`** - Login form with validation:
```csharp
public class LoginViewModel
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email")]
    public string Email { get; set; }

    [Required(ErrorMessage = "Password is required")]
    [DataType(DataType.Password)]
    public string Password { get; set; }

    public bool RememberMe { get; set; }
}
```

---

### 8. `Data/ApplicationDbContext.cs` - Database Context

```csharp
public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }
}
```

Uses **Entity Framework Core** with **ASP.NET Core Identity** tables (Users, Roles, Claims).

---

## 🌐 Razor Views (HTML + C#)

### 1. `Views/Shared/_Layout.cshtml` - Master Template

Every page inherits this layout containing navbar, scripts, and styles.

```html
<!DOCTYPE html>
<html>
<head>
    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="~/lib/bootstrap/dist/css/bootstrap.min.css" />
    <!-- Font Awesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
    <!-- Custom CSS -->
    <link rel="stylesheet" href="~/css/dashboard.css" />
</head>
<body>
    <nav class="navbar navbar-dark bg-primary">
        <a class="navbar-brand" asp-controller="Home" asp-action="Index">
            <i class="fas fa-heartbeat"></i> Health Dashboard
        </a>
        
        @if (User.Identity?.IsAuthenticated == true)
        {
            <span>@User.Identity.Name</span>
            <form asp-controller="Account" asp-action="Logout" method="post">
                <button type="submit">Logout</button>
            </form>
        }
    </nav>
    
    <main>
        @RenderBody()  <!-- Page content inserted here -->
    </main>

    <!-- jQuery -->
    <script src="~/lib/jquery/dist/jquery.min.js"></script>
    <!-- Bootstrap JS -->
    <script src="~/lib/bootstrap/dist/js/bootstrap.bundle.min.js"></script>
    
    @await RenderSectionAsync("Scripts", required: false)
</body>
</html>
```

**Razor Syntax:**
- `@if` - C# conditional
- `asp-controller`, `asp-action` - Tag Helpers generate URLs
- `@RenderBody()` - Placeholder for child page content
- `@RenderSectionAsync("Scripts")` - Optional scripts section

---

### 2. `Views/Home/Index.cshtml` - Main Dashboard

```html
@model HealthDashboard.Models.HealthDashboardViewModel

<!-- Bluetooth Connection Buttons -->
<div class="btn-group">
    <button id="connectHeartRate" class="btn btn-success">
        <i class="fas fa-heart"></i> Connect Heart Rate Monitor
    </button>
    <button id="connectThermometer" class="btn btn-info">
        <i class="fas fa-thermometer-half"></i> Connect Thermometer
    </button>
</div>

<!-- Live Data Cards -->
<div class="row">
    <div class="col-md-4">
        <div class="card stat-card" id="heartRateCard">
            <h5>Heart Rate</h5>
            <h2 id="heartRateValue">--</h2>
            <p>BPM</p>
        </div>
    </div>
</div>

<!-- Statistics using Model data (from LINQ) -->
<div class="stat-box">
    <h4>@Model.TotalReadings</h4>
    <p>Total Readings</p>
</div>

<!-- Averages by Type (LINQ GroupBy result) -->
@foreach (var avg in Model.AveragesByType)
{
    <div class="average-card">
        <h5>@avg.Key</h5>
        <h3>@avg.Value.ToString("F2")</h3>
    </div>
}

<!-- Recent Readings Table -->
<table class="table">
    @foreach (var reading in Model.RecentReadings)
    {
        <tr>
            <td>@reading.Timestamp.ToString("yyyy-MM-dd HH:mm:ss")</td>
            <td>@reading.DeviceType</td>
            <td>@reading.Value.ToString("F2")</td>
        </tr>
    }
</table>

@section Scripts {
    <script src="~/js/web-bluetooth.js"></script>
    <script src="~/js/dashboard.js"></script>
}
```

**Razor Features:**
- `@Model` - Access ViewModel data
- `@foreach` - Loop through collections
- `@section Scripts` - Add page-specific JavaScript

---

### 3. `Views/Account/Login.cshtml` - Login Form

```html
@model HealthDashboard.Models.LoginViewModel

<form asp-action="Login" method="post">
    <div asp-validation-summary="ModelOnly" class="alert alert-danger"></div>
    
    <div class="mb-3">
        <label asp-for="Email"></label>
        <input asp-for="Email" class="form-control" />
        <span asp-validation-for="Email" class="text-danger"></span>
    </div>
    
    <div class="mb-3">
        <label asp-for="Password"></label>
        <input asp-for="Password" class="form-control" />
        <span asp-validation-for="Password" class="text-danger"></span>
    </div>
    
    <button type="submit" class="btn btn-primary">Login</button>
</form>
```

**Tag Helpers:**
- `asp-for` - Binds to model property, generates name/id attributes
- `asp-validation-for` - Shows validation errors
- `asp-validation-summary` - Shows all model errors

---

## 📜 JavaScript Files

### 1. `wwwroot/js/web-bluetooth.js` - Bluetooth API

**Purpose:** Connect to BLE devices using Web Bluetooth API.

```javascript
class BluetoothHealthDevice {
    constructor() {
        this.devices = new Map();
        this.isBluetoothAvailable = 'bluetooth' in navigator;
    }

    // Connect to Heart Rate Monitor
    async connectHeartRateMonitor() {
        // Request device with heart_rate service
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ services: ['heart_rate'] }]
        });

        // Connect to GATT server
        const server = await device.gatt.connect();
        
        // Get Heart Rate Service
        const service = await server.getPrimaryService('heart_rate');
        
        // Get Heart Rate Measurement Characteristic
        const characteristic = await service.getCharacteristic('heart_rate_measurement');
        
        // Subscribe to notifications
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', (event) => {
            const heartRate = this.parseHeartRate(event.target.value);
            this.handleHeartRateData(device.id, device.name, heartRate);
        });
    }

    // Parse heart rate data (Bluetooth spec format)
    parseHeartRate(value) {
        const flags = value.getUint8(0);
        const rate16Bits = flags & 0x1;
        return rate16Bits ? value.getUint16(1, true) : value.getUint8(1);
    }

    // Update UI and send to server
    handleHeartRateData(deviceId, deviceName, value) {
        // jQuery animation
        $('#heartRateValue').text(value).hide().fadeIn(500);
        
        // Send to ASP.NET backend via AJAX
        this.sendReadingToServer({
            deviceId: deviceId,
            deviceType: 'heart_rate',
            value: value,
            unit: 'BPM'
        });
    }

    // jQuery AJAX POST to server
    sendReadingToServer(reading) {
        $.ajax({
            url: '/Health/AddReading',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(reading),
            success: function(response) {
                console.log('Reading saved');
            }
        });
    }
}

window.bluetoothDevice = new BluetoothHealthDevice();
```

**Web Bluetooth API Flow:**
1. `requestDevice()` - User selects device
2. `gatt.connect()` - Connect to Generic Attribute Profile
3. `getPrimaryService()` - Get service by UUID
4. `getCharacteristic()` - Get characteristic
5. `startNotifications()` - Subscribe to updates

---

### 2. `wwwroot/js/dashboard.js` - jQuery Interactions

**Purpose:** Handle button clicks, AJAX calls, and animations.

```javascript
$(document).ready(function() {
    // Connect Heart Rate button click
    $('#connectHeartRate').on('click', function() {
        $(this).prop('disabled', true)
               .html('<i class="fas fa-spinner fa-spin"></i> Connecting...');
        
        window.bluetoothDevice.connectHeartRateMonitor()
            .then(() => {
                $(this).prop('disabled', false)
                       .html('<i class="fas fa-heart"></i> Connect Heart Rate');
            });
    });

    // Clear all data with confirmation
    $('#clearData').on('click', function() {
        if (confirm('Are you sure?')) {
            $.ajax({
                url: '/Health/ClearAllReadings',
                type: 'DELETE',
                success: function() {
                    location.reload();
                }
            });
        }
    });

    // Auto-refresh every 10 seconds
    setInterval(refreshReadingsTable, 10000);
});

// Refresh table with jQuery AJAX
function refreshReadingsTable() {
    $.ajax({
        url: '/Health/GetReadings',
        type: 'GET',
        success: function(readings) {
            updateReadingsTable(readings);
        }
    });
}

// Update table with animation
function updateReadingsTable(readings) {
    const tbody = $('#readingsTable tbody');
    tbody.fadeOut(300, function() {
        tbody.empty();
        readings.forEach(function(reading) {
            const row = $('<tr>');
            row.append($('<td>').text(reading.deviceType));
            row.append($('<td>').text(reading.value.toFixed(2)));
            tbody.append(row);
        });
        tbody.fadeIn(300);
    });
}
```

**jQuery Concepts:**
- `$(document).ready()` - Execute when DOM loaded
- `$('#id')` - Select element by ID
- `.on('click', fn)` - Event handler
- `$.ajax()` - Asynchronous HTTP requests
- `.fadeIn()`, `.fadeOut()` - Animations
- `.prop()`, `.html()` - Modify elements

---

### 3. `wwwroot/js/apple-watch.js` - HealthKit Data Fetcher

```javascript
(function($) {
    var REFRESH_INTERVAL = 5000;

    function fetchWatchData() {
        $.ajax({
            url: '/api/health/latest',
            method: 'GET',
            success: function(data) {
                updateUI(data);
            }
        });
    }

    function updateUI(data) {
        if (data.heartRateBpm) {
            $('#watchHeartRateValue').text(Math.round(data.heartRateBpm));
        }
        if (data.temperatureC) {
            $('#watchTempValue').text(data.temperatureC.toFixed(1));
        }
    }

    // Auto-refresh and visibility handling
    $(document).ready(function() {
        fetchWatchData();
        setInterval(fetchWatchData, REFRESH_INTERVAL);
        
        // Pause when tab hidden (save resources)
        $(document).on('visibilitychange', function() {
            if (!document.hidden) fetchWatchData();
        });
    });
})(jQuery);
```

---

### 4. `wwwroot/js/auth-protection.js` - Security

**Purpose:** Prevent back-button access to protected pages after logout.

```javascript
(function() {
    // Prevent back navigation
    function preventBackNavigation() {
        window.history.pushState(null, '', window.location.href);
        
        window.addEventListener('popstate', function() {
            window.history.pushState(null, '', window.location.href);
        });
    }

    // Handle Safari's back-forward cache
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            window.location.reload();  // Force fresh load
        }
    });

    // Clear session data on logout
    function clearSensitiveData() {
        sessionStorage.clear();
        document.querySelectorAll('form').forEach(f => f.reset());
    }

    preventBackNavigation();
})();
```

---

## 🎨 CSS Styling

### `wwwroot/css/dashboard.css` - Premium Dark Theme

```css
/* Design System Variables */
:root {
    --bg: #0f1419;           /* Dark background */
    --surface: #1a1f2e;      /* Card background */
    --border: #2e3a4d;       /* Borders */
    --text: #f1f5f9;         /* White text */
    --primary: #6366f1;      /* Indigo accent */
    --success: #22c55e;      /* Green */
    --danger: #ef4444;       /* Red */
    --warning: #f59e0b;      /* Orange */
    --radius: 16px;          /* Rounded corners */
}

/* Dark body */
body {
    font-family: 'Inter', sans-serif;
    background: var(--bg);
    color: var(--text);
}

/* Glass-effect cards */
.card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    transition: transform 0.2s ease;
}

.card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 24px rgba(0,0,0,0.25);
}

/* Live data stat cards with colored accent */
#heartRateCard {
    box-shadow: inset 0 -3px 0 var(--danger);
}

#heartRateCard .display-3 {
    color: var(--danger);
    font-size: 3rem;
    font-weight: 700;
}

/* Buttons */
.btn-primary {
    background: var(--primary);
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
}

.btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

/* Tables */
.table {
    color: var(--text);
}

.table thead {
    background: var(--surface);
    text-transform: uppercase;
    font-size: 0.8rem;
}

.table tbody tr:hover {
    background: rgba(255, 255, 255, 0.05);
}
```

---

## 🔄 Data Flow Summary

```
┌─────────────────┐    Web Bluetooth    ┌──────────────────┐
│  Heart Rate     │ ──────────────────► │                  │
│  Monitor        │                     │   Browser        │
└─────────────────┘                     │   (JavaScript)   │
                                        │                  │
┌─────────────────┐    HealthKit Sync   │  web-bluetooth.js│
│  Apple Watch    │ ──────────────────► │  dashboard.js    │
│  (via iOS App)  │     POST /api/      │                  │
└─────────────────┘                     └────────┬─────────┘
                                                 │ AJAX POST
                                                 ▼
                                        ┌──────────────────┐
                                        │  ASP.NET Core    │
                                        │  Controllers     │
                                        │                  │
                                        │  HealthController│
                                        │  WatchSyncCtrl   │
                                        └────────┬─────────┘
                                                 │
                                                 ▼
                                        ┌──────────────────┐
                                        │ HealthDataService│
                                        │                  │
                                        │  LINQ Queries    │
                                        │  - Where()       │
                                        │  - GroupBy()     │
                                        │  - Average()     │
                                        └────────┬─────────┘
                                                 │
                                                 ▼
                                        ┌──────────────────┐
                                        │  Razor Views     │
                                        │  Index.cshtml    │
                                        │                  │
                                        │  @Model data     │
                                        │  @foreach loops  │
                                        └──────────────────┘
```

---

## 📝 Key Concepts for Presentation

### 1. **MVC Pattern**
- **Model** = DTOs and ViewModels (data)
- **View** = Razor .cshtml files (HTML)
- **Controller** = C# classes handling requests

### 2. **LINQ Demonstrations**
- `Where()` - Filter by user/condition
- `Select()` - Project/transform data
- `GroupBy()` - Group by device type
- `Average()`, `Count()`, `Max()` - Aggregations
- `ToDictionary()` - Convert to key-value pairs

### 3. **Web Bluetooth API**
- Modern browser API for BLE devices
- Standard services: `heart_rate`, `health_thermometer`
- GATT protocol for communication

### 4. **jQuery + AJAX**
- DOM manipulation with `$('#id')`
- Asynchronous requests with `$.ajax()`
- Animations with `.fadeIn()`, `.slideDown()`

### 5. **ASP.NET Core Identity**
- Built-in authentication system
- Cookie-based sessions
- `[Authorize]` attribute for protection

---

*Document generated for Web Programming Final Project presentation*
