# 🏥 Complete Code Documentation - Web Bluetooth Medical/Fitness Dashboard

> **Web Programming Final Project - Line-by-Line Explanation**  
> For presentation to judges/instructors

---

# TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [C# Backend Files](#c-backend-files-line-by-line)
3. [Razor Views (CSHTML)](#razor-views-cshtml-line-by-line)
4. [JavaScript Files](#javascript-files-line-by-line)
5. [CSS Styling](#css-styling)
6. [Data Flow Diagram](#data-flow-diagram)
7. [Judge/Instructor Q&A](#judgeinstructor-qa-section)

---

# Project Overview

## What This Project Does
A **medical/fitness dashboard** that:
1. Connects to Bluetooth health devices (heart rate monitors, thermometers)
2. Syncs Apple Watch data via iOS companion app
3. Displays real-time health data with live updates
4. Authenticates users with login/registration
5. Demonstrates LINQ queries for data analysis

## Technologies Stack
| Technology | Purpose | Files |
|------------|---------|-------|
| ASP.NET Core 8 MVC | Backend framework | Program.cs, Controllers/*.cs |
| Entity Framework Core | Database ORM | ApplicationDbContext.cs |
| ASP.NET Core Identity | Authentication | AccountController.cs |
| Razor Views | Server-side HTML | Views/*.cshtml |
| JavaScript/jQuery | Client interactivity | wwwroot/js/*.js |
| Web Bluetooth API | BLE device connection | web-bluetooth.js |
| CSS3 | Styling | wwwroot/css/*.css |
| Bootstrap 5 | Responsive layout | _Layout.cshtml |
| SQLite | Database | HealthDashboard.db |

---

# C# Backend Files (Line-by-Line)

## 1. Program.cs - Application Entry Point (108 lines)

This file configures and starts the entire ASP.NET Core application.

```csharp
// Lines 1-5: Import namespaces (libraries we need)
using HealthDashboard.Services;      // Our custom HealthDataService
using HealthDashboard.Data;          // Database context
using HealthDashboard.Models;        // Data models (DTOs, ViewModels)
using Microsoft.AspNetCore.Identity; // Authentication framework
using Microsoft.EntityFrameworkCore; // Database ORM

// Line 7: Create application builder - this is the starting point
var builder = WebApplication.CreateBuilder(args);

// Line 10: Register MVC with Views (Controllers return Views)
builder.Services.AddControllersWithViews();

// Line 11: Register HealthDataService as Singleton
// Singleton = ONE instance shared by ALL requests (keeps data in memory)
builder.Services.AddSingleton<HealthDataService>();

// Lines 14-16: Configure Entity Framework with SQLite database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") 
        ?? "Data Source=HealthDashboard.db"));
// "Data Source=HealthDashboard.db" = SQLite file in project folder

// Lines 19-31: Configure ASP.NET Core Identity (authentication)
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    // Password policy - relaxed for demo purposes
    options.Password.RequireDigit = false;          // No numbers required
    options.Password.RequireLowercase = false;      // No lowercase required
    options.Password.RequireUppercase = false;      // No uppercase required
    options.Password.RequireNonAlphanumeric = false; // No symbols required
    options.Password.RequiredLength = 6;            // Minimum 6 characters
    
    options.User.RequireUniqueEmail = true; // Each email can register once
})
.AddEntityFrameworkStores<ApplicationDbContext>() // Store users in our DB
.AddDefaultTokenProviders(); // For password reset tokens (not used here)

// Lines 34-42: Configure authentication cookies
builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = "/Account/Login";        // Redirect here if not logged in
    options.LogoutPath = "/Account/Logout";      // Logout URL
    options.AccessDeniedPath = "/Account/AccessDenied"; // No permission page
    options.ExpireTimeSpan = TimeSpan.FromHours(24);    // Cookie lasts 24 hours
    options.SlidingExpiration = true; // Extends expiry on each request
});

// Line 44: Build the application from configuration
var app = builder.Build();

// Lines 47-50: Ensure database exists (create tables if needed)
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    dbContext.Database.EnsureCreated(); // Creates DB and Identity tables
}

// Lines 53-58: Configure middleware pipeline for production
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error"); // Show error page
    app.UseHsts(); // HTTP Strict Transport Security
}

// Line 60: Redirect HTTP to HTTPS
app.UseHttpsRedirection();

// Line 62: Serve static files (CSS, JS, images from wwwroot/)
app.UseStaticFiles();

// Line 64: Enable routing
app.UseRouting();

// Line 66: Authentication middleware - checks cookies, sets User identity
app.UseAuthentication();

// Line 67: Authorization middleware - checks [Authorize] attributes
app.UseAuthorization();

// Lines 71-100: Custom middleware for cache control headers
app.Use(async (context, next) =>
{
    context.Response.OnStarting(() =>
    {
        var path = context.Request.Path.Value?.ToLower() ?? "";
        
        // Don't add headers to static files
        if (!path.StartsWith("/lib/") && !path.EndsWith(".css") && !path.EndsWith(".js"))
        {
            // Prevent browser from caching HTML pages
            context.Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
            context.Response.Headers["Pragma"] = "no-cache";
            context.Response.Headers["Expires"] = "-1";
        }
        return Task.CompletedTask;
    });
    await next(); // Continue to next middleware
});

// Lines 102-104: Configure default route pattern
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");
// Default: HomeController.Index() if no route specified
// Pattern: /Controller/Action/OptionalId

// Line 106: Start the application
app.Run();
```

---

## 2. HomeController.cs - Main Dashboard (44 lines)

```csharp
// Lines 1-6: Import required namespaces
using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;           // Controller base class
using Microsoft.AspNetCore.Authorization; // [Authorize] attribute
using Microsoft.AspNetCore.Identity;      // UserManager
using HealthDashboard.Models;
using HealthDashboard.Services;

namespace HealthDashboard.Controllers;

// Line 10: [Authorize] = EVERY action requires login
[Authorize]
public class HomeController : Controller  // Inherits from Controller base
{
    // Lines 13-15: Private readonly fields for dependency injection
    private readonly ILogger<HomeController> _logger;
    private readonly HealthDataService _healthDataService;
    private readonly UserManager<ApplicationUser> _userManager;

    // Lines 17-22: Constructor - ASP.NET injects services automatically
    public HomeController(ILogger<HomeController> logger, 
                         HealthDataService healthDataService, 
                         UserManager<ApplicationUser> userManager)
    {
        _logger = logger;
        _healthDataService = healthDataService;
        _userManager = userManager;
    }

    // Lines 24-30: Index action - displays main dashboard
    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    // ^^ Prevents browser from caching this page
    public IActionResult Index()
    {
        // Get current user's ID from authentication cookie
        var userId = _userManager.GetUserId(User) ?? "";
        
        // Get dashboard data (uses LINQ queries internally)
        var dashboardData = _healthDataService.GetDashboardData(userId);
        
        // Pass ViewModel to View (Views/Home/Index.cshtml)
        return View(dashboardData);
    }

    // Lines 32-36: Privacy page
    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Privacy()
    {
        return View(); // Returns Views/Home/Privacy.cshtml
    }

    // Lines 38-42: Error handler
    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { 
            RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier 
        });
    }
}
```

---

## 3. HealthController.cs - Health Data API with LINQ (178 lines)

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using HealthDashboard.Models;
using HealthDashboard.Services;
using System.Xml.Linq;      // For LINQ to XML
using System.Text.Json;      // For JSON serialization

namespace HealthDashboard.Controllers;

[Authorize] // All actions require authentication
public class HealthController : Controller
{
    private readonly HealthDataService _healthDataService;
    private readonly UserManager<ApplicationUser> _userManager;

    public HealthController(HealthDataService healthDataService, 
                           UserManager<ApplicationUser> userManager)
    {
        _healthDataService = healthDataService;
        _userManager = userManager;
    }

    // Helper method - gets current user's ID
    private string GetCurrentUserId() => _userManager.GetUserId(User) ?? "";

    // GET /Health - Show health data page
    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Index()
    {
        var userId = GetCurrentUserId();
        var dashboardData = _healthDataService.GetDashboardData(userId);
        return View(dashboardData);
    }

    // POST /Health/AddReading - Receive data from JavaScript
    [HttpPost] // Only accepts POST requests
    public IActionResult AddReading([FromBody] HealthReadingDto reading)
    // [FromBody] = parse JSON from request body into HealthReadingDto object
    {
        if (ModelState.IsValid) // Check validation attributes passed
        {
            var userId = GetCurrentUserId();
            _healthDataService.AddReading(reading, userId);
            return Json(new { success = true, message = "Reading added successfully" });
        }
        return Json(new { success = false, message = "Invalid data" });
    }

    // GET /Health/GetReadings - Return all readings as JSON
    [HttpGet]
    public IActionResult GetReadings()
    {
        var userId = GetCurrentUserId();
        var readings = _healthDataService.GetAllReadings(userId);
        return Json(readings); // Serializes List to JSON automatically
    }

    // GET /Health/GetReadingsByType?type=heart_rate
    [HttpGet]
    public IActionResult GetReadingsByType(string type)
    {
        var userId = GetCurrentUserId();
        // LINQ: Filter by device type
        var readings = _healthDataService.GetReadingsByDeviceType(userId, type);
        return Json(readings);
    }

    // GET /Health/GetStatistics - LINQ aggregation demo
    [HttpGet]
    public IActionResult GetStatistics()
    {
        var userId = GetCurrentUserId();
        var allReadings = _healthDataService.GetAllReadings(userId);
        
        // Anonymous object with LINQ aggregations
        var stats = new
        {
            // Count() - total number of items
            TotalReadings = allReadings.Count,
            
            // Select() + Distinct() - unique device types
            DeviceTypes = allReadings.Select(r => r.DeviceType).Distinct().ToList(),
            
            // Custom method using GroupBy + Average
            AveragesByType = _healthDataService.GetAveragesByType(userId),
            
            // Where() - filter by condition, Count() - count results
            ReadingsLast24Hours = allReadings
                .Where(r => r.Timestamp >= DateTime.Now.AddHours(-24))
                .Count(),
            
            // Max() - highest value (with null check)
            MaxValue = allReadings.Any() ? allReadings.Max(r => r.Value) : 0,
            
            // Min() - lowest value
            MinValue = allReadings.Any() ? allReadings.Min(r => r.Value) : 0
        };

        return Json(stats);
    }

    // GET /Health/ExportJson - Export as JSON file
    [HttpGet]
    public IActionResult ExportJson()
    {
        var userId = GetCurrentUserId();
        var readings = _healthDataService.GetAllReadings(userId);
        
        // System.Text.Json serialization with formatting
        var json = JsonSerializer.Serialize(readings, new JsonSerializerOptions 
        { 
            WriteIndented = true  // Pretty print
        });
        
        return Content(json, "application/json");
    }

    // GET /Health/ExportXml - LINQ to XML demonstration
    [HttpGet]
    public IActionResult ExportXml() 
    {
        var userId = GetCurrentUserId();
        var readings = _healthDataService.GetAllReadings(userId);
        
        // LINQ to XML - create XML structure functionally
        var xml = new XElement("HealthReadings",  // Root element
            readings.Select(r => new XElement("Reading",  // For each reading
                new XElement("Id", r.Id),
                new XElement("DeviceId", r.DeviceId),
                new XElement("DeviceType", r.DeviceType),
                new XElement("Value", r.Value),
                new XElement("Unit", r.Unit),
                new XElement("Timestamp", r.Timestamp.ToString("o")), // ISO format
                new XElement("Notes", r.Notes ?? "")
            ))
        );

        return Content(xml.ToString(), "application/xml");
    }

    // POST /Health/ImportJson - Import JSON data
    [HttpPost]
    public IActionResult ImportJson([FromBody] List<HealthReadingDto> readings)
    {
        var userId = GetCurrentUserId();
        if (readings != null && readings.Any()) // LINQ Any() - check not empty
        {
            foreach (var reading in readings)
            {
                _healthDataService.AddReading(reading, userId);
            }
            return Json(new { success = true, message = $"Imported {readings.Count} readings" });
        }
        return Json(new { success = false, message = "No valid readings provided" });
    }

    // GET /Health/Analytics - Advanced LINQ demonstration
    [HttpGet]
    public IActionResult Analytics()
    {
        var userId = GetCurrentUserId();
        var allReadings = _healthDataService.GetAllReadings(userId);
        
        var analytics = new
        {
            // GroupBy hour, count per group, order by hour
            ReadingsByHour = allReadings
                .GroupBy(r => r.Timestamp.Hour)         // Group by hour (0-23)
                .Select(g => new { Hour = g.Key, Count = g.Count() })
                .OrderBy(x => x.Hour)
                .ToList(),
                
            // GroupBy device, count, order descending
            ReadingsByDevice = _healthDataService.GetReadingsGroupedByDevice(userId)
                .Select(kvp => new { Device = kvp.Key, Count = kvp.Value.Count })
                .OrderByDescending(x => x.Count)
                .ToList(),
                
            // Complex: Filter + GroupBy + multiple aggregations
            RecentTrends = allReadings
                .Where(r => r.Timestamp >= DateTime.Now.AddHours(-24))
                .GroupBy(r => r.DeviceType)
                .Select(g => new 
                { 
                    Type = g.Key, 
                    Average = g.Average(r => r.Value),  // Average value
                    Count = g.Count(),                   // Count readings
                    Latest = g.OrderByDescending(r => r.Timestamp).First().Value // Latest
                })
                .ToList()
        };

        return Json(analytics);
    }

    // DELETE /Health/ClearAllReadings
    [HttpDelete]
    public IActionResult ClearAllReadings()
    {
        var userId = GetCurrentUserId();
        _healthDataService.ClearAllReadings(userId);
        return Json(new { success = true, message = "All readings cleared" });
    }
}
```

---

## 4. AccountController.cs - Authentication (170 lines)

```csharp
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using HealthDashboard.Models;

namespace HealthDashboard.Controllers;

public class AccountController : Controller
{
    // UserManager: Create, find, validate users
    private readonly UserManager<ApplicationUser> _userManager;
    // SignInManager: Login, logout, check authentication
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ILogger<AccountController> _logger;

    public AccountController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ILogger<AccountController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _logger = logger;
    }

    // GET /Account/Login - Show login form
    [HttpGet]
    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Login(string? returnUrl = null)
    {
        SetNoCacheHeaders(); // Prevent caching
        
        // If already logged in, redirect to dashboard
        if (User.Identity?.IsAuthenticated == true)
        {
            return RedirectToAction("Index", "Home");
        }
        ViewData["ReturnUrl"] = returnUrl; // Store for post-login redirect
        return View();
    }

    // POST /Account/Login - Process login form
    [HttpPost]
    [ValidateAntiForgeryToken] // CSRF protection - requires token in form
    public async Task<IActionResult> Login(LoginViewModel model, string? returnUrl = null)
    {
        ViewData["ReturnUrl"] = returnUrl;

        if (ModelState.IsValid) // Check validation passed
        {
            // Attempt to sign in with email and password
            var result = await _signInManager.PasswordSignInAsync(
                model.Email,      // Username (we use email)
                model.Password,   // Password
                model.RememberMe, // Persistent cookie?
                lockoutOnFailure: false); // Don't lock after failed attempts

            if (result.Succeeded)
            {
                _logger.LogInformation("User logged in.");
                return RedirectToLocal(returnUrl);
            }

            if (result.IsLockedOut)
            {
                _logger.LogWarning("User account locked out.");
                ModelState.AddModelError(string.Empty, "Account locked out.");
            }
            else
            {
                ModelState.AddModelError(string.Empty, "Invalid login attempt.");
            }
        }

        return View(model); // Return view with errors
    }

    // GET /Account/Register - Show registration form
    [HttpGet]
    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Register(string? returnUrl = null)
    {
        SetNoCacheHeaders();
        
        if (User.Identity?.IsAuthenticated == true)
        {
            return RedirectToAction("Index", "Home");
        }
        ViewData["ReturnUrl"] = returnUrl;
        return View();
    }

    // POST /Account/Register - Process registration form
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Register(RegisterViewModel model, string? returnUrl = null)
    {
        ViewData["ReturnUrl"] = returnUrl;

        if (ModelState.IsValid)
        {
            // Create new user object
            var user = new ApplicationUser
            {
                UserName = model.Email, // Identity uses UserName for login
                Email = model.Email,
                FullName = model.FullName
            };

            // Create user in database with hashed password
            var result = await _userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
            {
                _logger.LogInformation("User created a new account.");
                
                // Automatically sign in the new user
                await _signInManager.SignInAsync(user, isPersistent: false);
                return RedirectToLocal(returnUrl);
            }

            // Add any errors to ModelState for display
            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(string.Empty, error.Description);
            }
        }

        return View(model);
    }

    // POST /Account/Logout
    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize] // Must be logged in to logout
    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public async Task<IActionResult> Logout()
    {
        // Sign out - removes authentication cookie
        await _signInManager.SignOutAsync();
        
        // Clear ALL cookies for clean logout
        foreach (var cookie in Request.Cookies.Keys)
        {
            Response.Cookies.Delete(cookie);
        }
        
        _logger.LogInformation("User logged out.");
        SetNoCacheHeaders();
        
        // Redirect with cache-busting query parameter
        return RedirectToAction("Login", "Account", new { t = DateTime.UtcNow.Ticks });
    }

    [HttpGet]
    public IActionResult AccessDenied()
    {
        return View();
    }

    // Helper: Redirect to local URL only (security)
    private IActionResult RedirectToLocal(string? returnUrl)
    {
        if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
        {
            return Redirect(returnUrl);
        }
        return RedirectToAction("Index", "Home");
    }

    // Helper: Set no-cache HTTP headers
    private void SetNoCacheHeaders()
    {
        Response.Headers.CacheControl = "no-cache, no-store, must-revalidate";
        Response.Headers.Pragma = "no-cache";
        Response.Headers.Expires = "0";
    }
}
```

---

## 5. WatchSyncController.cs - REST API (195 lines)

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using HealthDashboard.Models;
using HealthDashboard.Services;

namespace HealthDashboard.Controllers.Api;

[ApiController]  // Enables API behaviors (automatic model validation, etc.)
[Route("api/health")]  // Base route: /api/health
public class WatchSyncController : ControllerBase  // ControllerBase = no View support
{
    private readonly HealthDataService _healthDataService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<WatchSyncController> _logger;

    public WatchSyncController(
        HealthDataService healthDataService, 
        UserManager<ApplicationUser> userManager,
        ILogger<WatchSyncController> logger)
    {
        _healthDataService = healthDataService;
        _userManager = userManager;
        _logger = logger;
    }

    // POST /api/health/watch-sync
    // Receives Apple Watch data from iOS app
    [HttpPost("watch-sync")]
    [Authorize]  // Requires authentication
    public IActionResult WatchSync([FromBody] WatchSyncPayload payload)
    {
        try
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new WatchSyncResponse 
                { 
                    Success = false, 
                    Message = "User not authenticated" 
                });
            }

            if (payload == null)
            {
                return BadRequest(new WatchSyncResponse 
                { 
                    Success = false, 
                    Message = "Invalid payload" 
                });
            }

            // Validate we received some data
            if (!payload.HeartRateBpm.HasValue && !payload.TemperatureC.HasValue)
            {
                return BadRequest(new WatchSyncResponse 
                { 
                    Success = false, 
                    Message = "No health data provided" 
                });
            }

            // Save to service
            _healthDataService.SaveWatchData(userId, payload);

            _logger.LogInformation(
                "Apple Watch sync for user {UserId}: HR={HeartRate}, Temp={Temp}", 
                userId, payload.HeartRateBpm, payload.TemperatureC);

            return Ok(new WatchSyncResponse 
            { 
                Success = true, 
                Message = "Data synced successfully" 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing Apple Watch data");
            return StatusCode(500, new WatchSyncResponse 
            { 
                Success = false, 
                Message = "Server error" 
            });
        }
    }

    // GET /api/health/latest
    // Returns latest Apple Watch data for dashboard
    [HttpGet("latest")]
    [Authorize]
    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult GetLatest()
    {
        var userId = _userManager.GetUserId(User);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var data = _healthDataService.GetLatestWatchData(userId);
        
        if (data == null)
        {
            // Return empty data structure (not an error)
            return Ok(new WatchLatestData
            {
                HeartRateBpm = null,
                TemperatureC = null,
                HasTemperature = false,
                Source = "",
                LastSyncUtc = null
            });
        }

        return Ok(data);
    }

    // POST /api/health/watch-sync-key
    // Alternative: Use email as API key instead of session
    [HttpPost("watch-sync-key")]
    [AllowAnonymous]  // No authentication required (uses API key)
    public async Task<IActionResult> WatchSyncWithKey([FromBody] WatchSyncPayload payload)
    {
        try
        {
            if (payload == null || string.IsNullOrEmpty(payload.ApiKey))
            {
                return BadRequest(new WatchSyncResponse 
                { 
                    Success = false, 
                    Message = "API key required" 
                });
            }

            // Find user by email (API key = email)
            var user = await _userManager.FindByEmailAsync(payload.ApiKey);
            if (user == null)
            {
                return Unauthorized(new WatchSyncResponse 
                { 
                    Success = false, 
                    Message = "Invalid API key" 
                });
            }

            if (!payload.HeartRateBpm.HasValue && !payload.TemperatureC.HasValue)
            {
                return BadRequest(new WatchSyncResponse 
                { 
                    Success = false, 
                    Message = "No health data provided" 
                });
            }

            _healthDataService.SaveWatchData(user.Id, payload);

            return Ok(new WatchSyncResponse 
            { 
                Success = true, 
                Message = "Data synced successfully" 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing via API key");
            return StatusCode(500, new WatchSyncResponse 
            { 
                Success = false, 
                Message = "Server error" 
            });
        }
    }
}
```

---

## 6. HealthDataService.cs - Business Logic with LINQ (157 lines)

```csharp
using HealthDashboard.Models;

namespace HealthDashboard.Services;

public class HealthDataService
{
    // Static = shared across all requests (in-memory storage)
    private static List<HealthReadingDto> _readings = new();
    private static int _nextId = 1;
    
    // Per-user Apple Watch data
    private static Dictionary<string, UserWatchData> _watchData = new();

    // Add a new reading
    public void AddReading(HealthReadingDto reading, string userId)
    {
        reading.Id = _nextId++;        // Auto-increment ID
        reading.UserId = userId;       // Associate with user
        reading.Timestamp = DateTime.Now;
        _readings.Add(reading);
    }

    // LINQ: Get all readings for user, sorted by newest first
    public List<HealthReadingDto> GetAllReadings(string userId)
    {
        return _readings
            .Where(r => r.UserId == userId)           // Filter by user
            .OrderByDescending(r => r.Timestamp)      // Sort newest first
            .ToList();                                // Execute query
    }

    // LINQ: Get recent readings with Take()
    public List<HealthReadingDto> GetRecentReadings(string userId, int count = 10)
    {
        return _readings
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.Timestamp)
            .Take(count)                              // Limit results
            .ToList();
    }

    // LINQ: GroupBy device ID, return Dictionary
    public Dictionary<string, List<HealthReadingDto>> GetReadingsGroupedByDevice(string userId)
    {
        return _readings
            .Where(r => r.UserId == userId)
            .GroupBy(r => r.DeviceId)                 // Group by device
            .ToDictionary(
                g => g.Key,                           // Key = DeviceId
                g => g.OrderByDescending(r => r.Timestamp).ToList()  // Value = readings
            );
    }

    // LINQ: GroupBy + Average aggregation
    public Dictionary<string, double> GetAveragesByType(string userId)
    {
        return _readings
            .Where(r => r.UserId == userId)
            .GroupBy(r => r.DeviceType)               // Group by type
            .Where(g => g.Any())                      // Exclude empty groups
            .ToDictionary(
                g => g.Key,                           // Key = DeviceType
                g => g.Average(r => r.Value)          // Value = average
            );
    }

    // LINQ: Filter by device type (case-insensitive)
    public List<HealthReadingDto> GetReadingsByDeviceType(string userId, string deviceType)
    {
        return _readings
            .Where(r => r.UserId == userId && 
                   r.DeviceType.Equals(deviceType, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(r => r.Timestamp)
            .ToList();
    }

    // Get complete dashboard data
    public HealthDashboardViewModel GetDashboardData(string userId)
    {
        var userReadings = _readings.Where(r => r.UserId == userId).ToList();
        
        return new HealthDashboardViewModel
        {
            RecentReadings = GetRecentReadings(userId, 20),
            ReadingsByDevice = GetReadingsGroupedByDevice(userId),
            AveragesByType = GetAveragesByType(userId),
            TotalReadings = userReadings.Count,
            LastReadingTime = userReadings.Any() 
                ? userReadings.Max(r => r.Timestamp)  // LINQ Max
                : null
        };
    }

    // Delete all readings for user
    public void ClearAllReadings(string userId)
    {
        _readings.RemoveAll(r => r.UserId == userId);
    }
    
    // Save Apple Watch data
    public void SaveWatchData(string userId, WatchSyncPayload payload)
    {
        var watchData = new UserWatchData
        {
            UserId = userId,
            HeartRateBpm = payload.HeartRateBpm,
            TemperatureC = payload.TemperatureC,
            Source = payload.Source,
            LastSyncUtc = payload.TimestampUtc ?? DateTime.UtcNow
        };
        
        _watchData[userId] = watchData;  // Store/update
        
        // Also add as regular readings for history
        if (payload.HeartRateBpm.HasValue)
        {
            AddReading(new HealthReadingDto
            {
                DeviceId = "AppleWatch",
                DeviceType = "HeartRate",
                Value = payload.HeartRateBpm.Value,
                Unit = "BPM",
                Notes = "HealthKit Sync"
            }, userId);
        }
        
        if (payload.TemperatureC.HasValue)
        {
            AddReading(new HealthReadingDto
            {
                DeviceId = "AppleWatch",
                DeviceType = "Temperature",
                Value = payload.TemperatureC.Value,
                Unit = "°C",
                Notes = "Wrist Temp (HealthKit)"
            }, userId);
        }
    }
    
    // Get latest Apple Watch data
    public WatchLatestData? GetLatestWatchData(string userId)
    {
        if (!_watchData.TryGetValue(userId, out var data))
        {
            return null;
        }
        
        return new WatchLatestData
        {
            HeartRateBpm = data.HeartRateBpm,
            TemperatureC = data.TemperatureC,
            HasTemperature = data.TemperatureC.HasValue,
            Source = data.Source,
            LastSyncUtc = data.LastSyncUtc
        };
    }
}
```

---

## 7. Models (DTOs and ViewModels)

### HealthReadingDto.cs
```csharp
namespace HealthDashboard.Models;

// DTO = Data Transfer Object - carries data between layers
public class HealthReadingDto
{
    public int Id { get; set; }                      // Unique identifier
    public string UserId { get; set; } = string.Empty;  // Owner user
    public string DeviceId { get; set; } = string.Empty; // e.g., "BT-001"
    public string DeviceType { get; set; } = string.Empty; // e.g., "heart_rate"
    public double Value { get; set; }                // The measurement
    public string Unit { get; set; } = string.Empty; // e.g., "BPM", "°C"
    public DateTime Timestamp { get; set; }          // When recorded
    public string? Notes { get; set; }               // Optional notes
}
```

### HealthDashboardViewModel.cs
```csharp
namespace HealthDashboard.Models;

// ViewModel = Data shaped for a specific View
public class HealthDashboardViewModel
{
    public List<HealthReadingDto> RecentReadings { get; set; } = new();
    public Dictionary<string, List<HealthReadingDto>> ReadingsByDevice { get; set; } = new();
    public Dictionary<string, double> AveragesByType { get; set; } = new(); // LINQ result
    public int TotalReadings { get; set; }
    public DateTime? LastReadingTime { get; set; }
}
```

### LoginViewModel.cs
```csharp
using System.ComponentModel.DataAnnotations;

namespace HealthDashboard.Models;

public class LoginViewModel
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email address")]
    [Display(Name = "Email")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [DataType(DataType.Password)]  // Renders as password field
    [Display(Name = "Password")]
    public string Password { get; set; } = string.Empty;

    [Display(Name = "Remember me")]
    public bool RememberMe { get; set; }
}
```

### RegisterViewModel.cs
```csharp
using System.ComponentModel.DataAnnotations;

namespace HealthDashboard.Models;

public class RegisterViewModel
{
    [Required(ErrorMessage = "Full name is required")]
    [Display(Name = "Full Name")]
    [StringLength(100, ErrorMessage = "Cannot exceed 100 characters")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email")]
    [Display(Name = "Email")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "At least 6 characters")]
    [DataType(DataType.Password)]
    [Display(Name = "Password")]
    public string Password { get; set; } = string.Empty;

    [DataType(DataType.Password)]
    [Display(Name = "Confirm Password")]
    [Compare("Password", ErrorMessage = "Passwords do not match")]
    public string ConfirmPassword { get; set; } = string.Empty;
}
```

### ApplicationUser.cs
```csharp
using Microsoft.AspNetCore.Identity;

namespace HealthDashboard.Models;

// Extends default IdentityUser with custom properties
public class ApplicationUser : IdentityUser
{
    public string? FullName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

### ApplicationDbContext.cs
```csharp
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using HealthDashboard.Models;

namespace HealthDashboard.Data;

// IdentityDbContext provides User, Role, Claims tables
public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(); // Configure Identity tables
    }
}
```

---

*(Continued in Part 2 - Razor Views, JavaScript, CSS, and Q&A)*
