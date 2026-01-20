# 📁 Project Folder & File Structure Quick Reference

> **Use this guide to quickly locate any file when judges ask questions**

---

## Top-Level Project Structure

```
Web-Bluetooth-Medical-Fitness-Dashboard/
│
├── HealthDashboard/          ← ASP.NET Core Backend (C#)
│
├── HealthDashboardiOS/       ← iOS App (Swift)
│
├── CODE_DOCUMENTATION_*.md   ← Your documentation files
├── README.md                 ← Project overview
├── Dockerfile                ← Docker deployment
└── render.yaml               ← Render.com deployment config
```

---

## 🔷 HealthDashboard/ (ASP.NET Core Backend)

```
HealthDashboard/
│
├── Program.cs                      ← APP ENTRY POINT (start here!)
│                                     - Dependency injection setup
│                                     - Database config
│                                     - Authentication config
│                                     - Middleware pipeline
│
├── Controllers/                    ← REQUEST HANDLERS
│   ├── HomeController.cs           ← Main dashboard (/)
│   ├── HealthController.cs         ← Health data API (/Health/*)
│   │                                 - LINQ queries
│   │                                 - JSON/XML export
│   ├── AccountController.cs        ← Login/Register/Logout
│   └── Api/
│       └── WatchSyncController.cs  ← iOS API (/api/health/*)
│
├── Models/                         ← DATA CLASSES (DTOs, ViewModels)
│   ├── HealthReadingDto.cs         ← Health reading data structure
│   ├── HealthDashboardViewModel.cs ← Dashboard data for View
│   ├── LoginViewModel.cs           ← Login form data
│   ├── RegisterViewModel.cs        ← Register form data
│   ├── WatchSyncPayload.cs         ← iOS sync data structures
│   ├── ApplicationUser.cs          ← Custom user (extends Identity)
│   ├── ErrorViewModel.cs           ← Error page data
│   └── DeviceConnectionDto.cs      ← Bluetooth device info
│
├── Services/                       ← BUSINESS LOGIC
│   └── HealthDataService.cs        ← All LINQ queries here!
│                                     - GetAllReadings()
│                                     - GetAveragesByType()
│                                     - GroupBy examples
│
├── Data/                           ← DATABASE
│   └── ApplicationDbContext.cs     ← Entity Framework context
│
├── Views/                          ← RAZOR HTML TEMPLATES
│   ├── _ViewStart.cshtml           ← Sets default layout
│   ├── _ViewImports.cshtml         ← Global using statements
│   │
│   ├── Shared/                     ← Shared templates
│   │   ├── _Layout.cshtml          ← MASTER TEMPLATE (navbar, scripts)
│   │   ├── _Layout.cshtml.css      ← Layout-specific styles
│   │   ├── _ValidationScriptsPartial.cshtml
│   │   └── Error.cshtml            ← Error page
│   │
│   ├── Home/                       ← Home controller views
│   │   ├── Index.cshtml            ← MAIN DASHBOARD PAGE
│   │   └── Privacy.cshtml          ← Privacy page
│   │
│   ├── Health/                     ← Health controller views
│   │   └── Index.cshtml            ← Health data page
│   │
│   └── Account/                    ← Account controller views
│       ├── Login.cshtml            ← LOGIN PAGE
│       ├── Register.cshtml         ← SIGN UP PAGE
│       └── AccessDenied.cshtml     ← 403 page
│
└── wwwroot/                        ← STATIC FILES (served directly)
    ├── css/
    │   ├── dashboard.css           ← MAIN STYLES (dark theme, cards)
    │   └── site.css                ← Base styles
    │
    ├── js/
    │   ├── web-bluetooth.js        ← WEB BLUETOOTH API
    │   ├── dashboard.js            ← JQUERY/AJAX interactions
    │   ├── apple-watch.js          ← Fetch Apple Watch data
    │   ├── auth-protection.js      ← Back button prevention
    │   ├── auth-pages.js           ← Login/register page JS
    │   └── site.js                 ← Empty placeholder
    │
    └── lib/                        ← Third-party libraries
        ├── bootstrap/              ← Bootstrap CSS/JS
        └── jquery/                 ← jQuery library
```

---

## 🍎 HealthDashboardiOS/ (iOS Swift App)

```
HealthDashboardiOS/
│
└── HealthDashboardiOS/
    ├── HealthDashboardiOSApp.swift  ← APP ENTRY POINT (@main)
    ├── ContentView.swift            ← MAIN UI (SwiftUI)
    │                                  - Header, cards, buttons
    │                                  - Auto-sync timer
    ├── HealthKitManager.swift       ← HEALTHKIT INTEGRATION
    │                                  - Authorization
    │                                  - Heart rate queries
    │                                  - Temperature queries
    └── APIService.swift             ← HTTP CLIENT
                                       - POST to backend
                                       - JSON encoding
```

---

## 🗺️ Quick Lookup Table

### "Where is the code for...?"

| Topic | File Location |
|-------|---------------|
| **App startup/config** | `HealthDashboard/Program.cs` |
| **Main dashboard HTML** | `Views/Home/Index.cshtml` |
| **Login page** | `Views/Account/Login.cshtml` |
| **Login logic** | `Controllers/AccountController.cs` |
| **LINQ queries** | `Services/HealthDataService.cs` |
| **LINQ in controller** | `Controllers/HealthController.cs` |
| **API endpoints** | `Controllers/Api/WatchSyncController.cs` |
| **Web Bluetooth** | `wwwroot/js/web-bluetooth.js` |
| **jQuery/AJAX** | `wwwroot/js/dashboard.js` |
| **CSS styling** | `wwwroot/css/dashboard.css` |
| **Master layout** | `Views/Shared/_Layout.cshtml` |
| **iOS main UI** | `HealthDashboardiOS/ContentView.swift` |
| **HealthKit code** | `HealthDashboardiOS/HealthKitManager.swift` |
| **iOS API calls** | `HealthDashboardiOS/APIService.swift` |

---

## 🔍 Common Judge Questions → File Locations

| Question | Where to Look |
|----------|---------------|
| "Show me your LINQ code" | `Services/HealthDataService.cs` (lines 21-66) |
| "How does login work?" | `Controllers/AccountController.cs` (Login methods) |
| "Show me your MVC structure" | `Controllers/` + `Models/` + `Views/` folders |
| "Where's the database?" | `Data/ApplicationDbContext.cs` |
| "Show me jQuery/AJAX" | `wwwroot/js/dashboard.js` |
| "How do you connect Bluetooth?" | `wwwroot/js/web-bluetooth.js` |
| "Show me the API" | `Controllers/Api/WatchSyncController.cs` |
| "How does iOS send data?" | `HealthDashboardiOS/APIService.swift` |
| "Where's the CSS?" | `wwwroot/css/dashboard.css` |
| "Show me the main page HTML" | `Views/Home/Index.cshtml` |
| "How do you export to XML?" | `Controllers/HealthController.cs` (ExportXml method) |
| "Show me data validation" | `Models/LoginViewModel.cs` (attributes) |
| "Where's authentication config?" | `Program.cs` (lines 19-42) |

---

## 📂 File Type Legend

| Extension | Type | Technology |
|-----------|------|------------|
| `.cs` | C# code | ASP.NET Core |
| `.cshtml` | Razor View | HTML + C# |
| `.js` | JavaScript | Client-side |
| `.css` | Stylesheet | Styling |
| `.swift` | Swift code | iOS App |
| `.json` | Config/Data | Various |
| `.db` | Database | SQLite |

---

## 🎯 Key Files to Know (Top 10)

1. **`Program.cs`** - Where the app starts, all configuration
2. **`HealthDataService.cs`** - All LINQ queries
3. **`HealthController.cs`** - Health API with LINQ
4. **`AccountController.cs`** - Login/Register logic
5. **`Views/Home/Index.cshtml`** - Main dashboard UI
6. **`Views/Shared/_Layout.cshtml`** - Master template
7. **`wwwroot/js/web-bluetooth.js`** - Bluetooth connection
8. **`wwwroot/js/dashboard.js`** - jQuery interactions
9. **`wwwroot/css/dashboard.css`** - All styling
10. **`HealthDashboardiOS/ContentView.swift`** - iOS app UI

---

*Print this and keep it handy during your presentation!*
