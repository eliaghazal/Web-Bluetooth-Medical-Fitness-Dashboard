# Code Documentation - Part 3: APIs & iOS/Swift Complete Guide

---

# 📡 API DOCUMENTATION

## What is an API?
An **API (Application Programming Interface)** is a contract that defines how different software components communicate. In web development, REST APIs use HTTP to send/receive data.

---

## APIs We CREATED (Backend Endpoints)

### Overview of All API Endpoints

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/Health/AddReading` | POST | Save health reading | Yes (Cookie) |
| `/Health/GetReadings` | GET | Get all readings | Yes (Cookie) |
| `/Health/GetStatistics` | GET | Get LINQ stats | Yes (Cookie) |
| `/Health/Analytics` | GET | Advanced analytics | Yes (Cookie) |
| `/Health/ExportJson` | GET | Export as JSON | Yes (Cookie) |
| `/Health/ExportXml` | GET | Export as XML | Yes (Cookie) |
| `/Health/ClearAllReadings` | DELETE | Delete all data | Yes (Cookie) |
| `/api/health/watch-sync` | POST | Sync (session auth) | Yes (Cookie) |
| `/api/health/watch-sync-key` | POST | Sync (API key) | No (uses email) |
| `/api/health/latest` | GET | Get latest watch data | Yes (Cookie) |

---

### API 1: POST /Health/AddReading

**Purpose:** Receive health data from JavaScript (Web Bluetooth)

**Controller Code:**
```csharp
[HttpPost]  // Only accepts POST requests
public IActionResult AddReading([FromBody] HealthReadingDto reading)
{
    // [FromBody] tells ASP.NET to parse JSON body into HealthReadingDto
    if (ModelState.IsValid)  // Check validation passed
    {
        var userId = GetCurrentUserId();  // Get from auth cookie
        _healthDataService.AddReading(reading, userId);
        return Json(new { success = true, message = "Reading added" });
    }
    return Json(new { success = false, message = "Invalid data" });
}
```

**JavaScript Call (jQuery AJAX):**
```javascript
$.ajax({
    url: '/Health/AddReading',
    type: 'POST',
    contentType: 'application/json',  // Tell server we're sending JSON
    data: JSON.stringify({            // Convert JS object to JSON string
        deviceId: 'BT-001',
        deviceType: 'heart_rate',
        value: 72,
        unit: 'BPM'
    }),
    success: function(response) {
        console.log(response.message);  // "Reading added"
    }
});
```

**Request/Response:**
```
REQUEST:
POST /Health/AddReading HTTP/1.1
Content-Type: application/json
Cookie: .AspNetCore.Identity.Application=xxx

{"deviceId":"BT-001","deviceType":"heart_rate","value":72,"unit":"BPM"}

RESPONSE:
HTTP/1.1 200 OK
Content-Type: application/json

{"success":true,"message":"Reading added successfully"}
```

---

### API 2: GET /Health/GetReadings

**Purpose:** Return all readings as JSON array

**Controller Code:**
```csharp
[HttpGet]
public IActionResult GetReadings()
{
    var userId = GetCurrentUserId();
    var readings = _healthDataService.GetAllReadings(userId);  // LINQ query
    return Json(readings);  // ASP.NET serializes List<> to JSON array
}
```

**JavaScript Call:**
```javascript
$.ajax({
    url: '/Health/GetReadings',
    type: 'GET',
    success: function(readings) {
        // readings is already a parsed array (jQuery auto-parses)
        readings.forEach(function(r) {
            console.log(r.deviceType, r.value);
        });
    }
});
```

**Response:**
```json
[
    {
        "id": 1,
        "userId": "abc123",
        "deviceId": "BT-001",
        "deviceType": "heart_rate",
        "value": 72.0,
        "unit": "BPM",
        "timestamp": "2026-01-20T10:30:00",
        "notes": null
    }
]
```

---

### API 3: POST /api/health/watch-sync-key (iOS API)

**Purpose:** Receive Apple Watch data from iOS app using email as API key

**Controller Code:**
```csharp
[ApiController]
[Route("api/health")]
public class WatchSyncController : ControllerBase
{
    [HttpPost("watch-sync-key")]
    [AllowAnonymous]  // No session required - uses API key instead
    public async Task<IActionResult> WatchSyncWithKey([FromBody] WatchSyncPayload payload)
    {
        // Validate API key exists
        if (string.IsNullOrEmpty(payload.ApiKey))
        {
            return BadRequest(new { Success = false, Message = "API key required" });
        }

        // Find user by email (email = API key)
        var user = await _userManager.FindByEmailAsync(payload.ApiKey);
        if (user == null)
        {
            return Unauthorized(new { Success = false, Message = "Invalid API key" });
        }

        // Save the data
        _healthDataService.SaveWatchData(user.Id, payload);

        return Ok(new { Success = true, Message = "Data synced successfully" });
    }
}
```

**iOS Swift Call:**
```swift
// Create payload
let payload = WatchSyncPayload(
    apiKey: "user@email.com",       // User's email as API key
    heartRateBpm: 75.0,
    temperatureC: 36.5,
    source: "AppleWatch_HealthKit",
    timestampUtc: ISO8601DateFormatter().string(from: Date())
)

// Send HTTP request
var request = URLRequest(url: URL(string: "https://example.com/api/health/watch-sync-key")!)
request.httpMethod = "POST"
request.setValue("application/json", forHTTPHeaderField: "Content-Type")
request.httpBody = try JSONEncoder().encode(payload)

URLSession.shared.dataTask(with: request) { data, response, error in
    // Handle response
}.resume()
```

---

### API 4: GET /api/health/latest

**Purpose:** Dashboard fetches latest Apple Watch data

**Controller Code:**
```csharp
[HttpGet("latest")]
[Authorize]  // Requires browser session cookie
[ResponseCache(Duration = 0, NoStore = true)]  // No caching
public IActionResult GetLatest()
{
    var userId = _userManager.GetUserId(User);
    var data = _healthDataService.GetLatestWatchData(userId);
    
    return Ok(data ?? new WatchLatestData());  // Return empty if no data
}
```

**JavaScript Call (apple-watch.js):**
```javascript
function fetchWatchData() {
    $.ajax({
        url: '/api/health/latest',
        method: 'GET',
        success: function(data) {
            $('#watchHeartRateValue').text(data.heartRateBpm || '--');
            $('#watchTempValue').text(data.temperatureC?.toFixed(1) || 'N/A');
        }
    });
}
```

---

## APIs We CONSUMED (External APIs)

### 1. COVID-19 Data API

**Source:** disease.sh (open COVID-19 API)

```javascript
// In dashboard.js
function fetchCovidData() {
    $.ajax({
        url: 'https://disease.sh/v3/covid-19/all',  // External API
        type: 'GET',
        success: function(data) {
            // data contains: cases, recovered, active, deaths
            displayCovidWidget(data);
        }
    });
}
```

---

### 2. Web Bluetooth API

**Purpose:** Connect to BLE devices directly from browser

```javascript
// Request device from user
const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: ['heart_rate'] }]  // Filter to heart rate devices
});

// Connect to GATT server
const server = await device.gatt.connect();

// Get service
const service = await server.getPrimaryService('heart_rate');

// Get characteristic
const characteristic = await service.getCharacteristic('heart_rate_measurement');

// Subscribe to notifications
await characteristic.startNotifications();
characteristic.addEventListener('characteristicvaluechanged', (event) => {
    const heartRate = parseHeartRateData(event.target.value);
});
```

---

### 3. Apple HealthKit API (iOS)

**Purpose:** Read health data from iPhone/Apple Watch

```swift
// Import HealthKit framework
import HealthKit

let healthStore = HKHealthStore()

// Request authorization
let typesToRead: Set<HKObjectType> = [
    HKObjectType.quantityType(forIdentifier: .heartRate)!
]

healthStore.requestAuthorization(toShare: nil, read: typesToRead) { success, error in
    if success {
        // Can now read health data
    }
}

// Query for heart rate
let query = HKSampleQuery(
    sampleType: HKQuantityType.quantityType(forIdentifier: .heartRate)!,
    predicate: nil,
    limit: 1,
    sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
) { query, samples, error in
    if let sample = samples?.first as? HKQuantitySample {
        let heartRate = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
        // heartRate = 72.0 (BPM)
    }
}

healthStore.execute(query)
```

---

# 📱 iOS/SWIFT COMPLETE DOCUMENTATION

## Project Structure

```
HealthDashboardiOS/
├── HealthDashboardiOSApp.swift   // App entry point
├── ContentView.swift              // Main UI (SwiftUI)
├── HealthKitManager.swift         // HealthKit integration
├── APIService.swift               // HTTP API calls
└── Info.plist                     // App permissions
```

---

## 1. HealthDashboardiOSApp.swift (11 lines)

```swift
import SwiftUI

@main  // Entry point marker (like main() in C)
struct HealthDashboardiOSApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()  // Load main view
        }
    }
}
```

**Explanation:**
- `@main` - Tells Swift this is the app entry point
- `App` protocol - SwiftUI app lifecycle
- `WindowGroup` - Creates app window
- `ContentView()` - The root view of the app

---

## 2. APIService.swift - HTTP Client (118 lines)

### Data Models (Codable)

```swift
/// Payload sent TO the server
struct WatchSyncPayload: Codable {
    let apiKey: String?        // User's email for authentication
    let heartRateBpm: Double?  // Heart rate (optional)
    let temperatureC: Double?  // Temperature (optional)
    let source: String         // "AppleWatch_HealthKit"
    let timestampUtc: String   // ISO 8601 date string
}

/// Response FROM the server
struct WatchSyncResponse: Codable {
    let success: Bool
    let message: String
}
```

**Codable Protocol:**
- Swift's built-in JSON encoding/decoding
- Automatically maps property names to JSON keys
- `let` = immutable property

### APIService Class

```swift
class APIService: ObservableObject {
    // @Published = SwiftUI observes changes, updates UI automatically
    @Published var isLoading = false
    @Published var lastError: String?
    
    /// Sync health data to backend
    func syncData(to baseURL: String, payload: WatchSyncPayload, 
                  completion: @escaping (Result<String, Error>) -> Void) {
        
        isLoading = true  // UI shows loading spinner
        lastError = nil
        
        // 1. Build URL
        let urlString = "\(baseURL)/api/health/watch-sync-key"
        guard let url = URL(string: urlString) else {
            completion(.failure(APIError.invalidURL))
            return
        }
        
        // 2. Create HTTP request
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // 3. Encode payload to JSON
        do {
            let encoder = JSONEncoder()
            request.httpBody = try encoder.encode(payload)
            // payload becomes: {"apiKey":"user@email.com","heartRateBpm":72.0,...}
        } catch {
            completion(.failure(error))
            return
        }
        
        // 4. Make async network request
        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            // [weak self] prevents memory leaks (retain cycle)
            
            // Switch to main thread for UI updates
            DispatchQueue.main.async {
                self?.isLoading = false
                
                // Handle network error
                if let error = error {
                    self?.lastError = error.localizedDescription
                    completion(.failure(error))
                    return
                }
                
                // Parse JSON response
                guard let data = data else {
                    completion(.failure(APIError.noData))
                    return
                }
                
                do {
                    let decoder = JSONDecoder()
                    let response = try decoder.decode(WatchSyncResponse.self, from: data)
                    
                    if response.success {
                        completion(.success(response.message))
                    } else {
                        completion(.failure(APIError.serverError(response.message)))
                    }
                } catch {
                    completion(.failure(error))
                }
            }
        }.resume()  // Start the request
    }
}
```

### Error Enum

```swift
enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case noData
    case serverError(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid URL"
        case .invalidResponse: return "Invalid server response"
        case .noData: return "No data received"
        case .serverError(let message): return message
        }
    }
}
```

---

## 3. HealthKitManager.swift - Apple Health (235 lines)

### Class Declaration

```swift
import HealthKit

class HealthKitManager: ObservableObject {
    // HKHealthStore = gateway to user's health data
    private let healthStore = HKHealthStore()
    
    // Observer for real-time updates
    private var observerQuery: HKObserverQuery?
    
    // @Published properties update SwiftUI views automatically
    @Published var isAuthorized = false
    @Published var latestHeartRate: Double?
    @Published var latestTemperature: Double?
    @Published var errorMessage: String?
    
    init() {
        checkAuthorizationStatus()  // Check on launch
    }
}
```

### Request Authorization

```swift
/// Request permission to read health data
func requestAuthorization() {
    // Check if HealthKit is available (not on iPad)
    guard HKHealthStore.isHealthDataAvailable() else {
        errorMessage = "HealthKit not available"
        return
    }
    
    // Define what we want to read
    var typesToRead: Set<HKObjectType> = [
        HKObjectType.quantityType(forIdentifier: .heartRate)!
    ]
    
    // Add temperature if iOS 16+
    if #available(iOS 16.0, *) {
        if let wristTemp = HKObjectType.quantityType(forIdentifier: .appleSleepingWristTemperature) {
            typesToRead.insert(wristTemp)
        }
    }
    
    // Request authorization (shows system popup)
    healthStore.requestAuthorization(toShare: nil, read: typesToRead) { [weak self] success, error in
        DispatchQueue.main.async {
            if success {
                self?.isAuthorized = true
                self?.fetchLatestData()      // Get data immediately
                self?.startObserving()       // Start real-time updates
            } else {
                self?.errorMessage = error?.localizedDescription
            }
        }
    }
}
```

### Fetch Heart Rate

```swift
private func fetchLatestHeartRate() {
    // Get heart rate type
    guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) else { return }
    
    // Sort by date descending (newest first)
    let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
    
    // Create query
    let query = HKSampleQuery(
        sampleType: heartRateType,
        predicate: nil,          // No filter
        limit: 1,                // Only get 1 sample
        sortDescriptors: [sortDescriptor]
    ) { [weak self] _, samples, error in
        
        DispatchQueue.main.async {
            guard let sample = samples?.first as? HKQuantitySample else {
                self?.latestHeartRate = nil
                return
            }
            
            // Convert to BPM (beats per minute)
            // HealthKit stores as count/time, we convert to count/minute
            let heartRate = sample.quantity.doubleValue(
                for: HKUnit.count().unitDivided(by: .minute())
            )
            
            self?.latestHeartRate = heartRate  // e.g., 72.0
        }
    }
    
    healthStore.execute(query)  // Run the query
}
```

### Observer Query (Real-time Updates)

```swift
private func startObserving() {
    guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) else { return }
    
    // Observer query - fires when new data is added to HealthKit
    observerQuery = HKObserverQuery(sampleType: heartRateType, predicate: nil) { [weak self] _, completionHandler, error in
        
        if error == nil {
            // New data available - fetch it
            DispatchQueue.main.async {
                self?.fetchLatestData()
            }
        }
        
        completionHandler()  // Must call this
    }
    
    if let query = observerQuery {
        healthStore.execute(query)
    }
}
```

---

## 4. ContentView.swift - SwiftUI Interface (399 lines)

### State Management

```swift
struct ContentView: View {
    // @StateObject = owns the object, creates it
    @StateObject private var healthKitManager = HealthKitManager()
    @StateObject private var apiService = APIService()
    
    // @State = simple values that change
    @State private var dashboardURL = "https://health-dashboard.onrender.com"
    @State private var userEmail = ""
    @State private var autoSyncEnabled = true
    @State private var lastSyncTime: Date?
    
    // Timer for auto-sync (every 30 seconds)
    let syncTimer = Timer.publish(every: 30, on: .main, in: .common).autoconnect()
```

### Main View Body

```swift
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    headerSection           // App logo
                    autoSyncStatusSection   // Auto-sync indicator
                    authorizationSection    // HealthKit permission
                    
                    if healthKitManager.isAuthorized {
                        healthDataSection   // Heart rate & temp cards
                        syncSection         // Sync button
                    }
                    
                    settingsSection         // URL and email display
                }
                .padding()
            }
            .navigationTitle("Health Dashboard")
            
            // Listen for timer events
            .onReceive(syncTimer) { _ in
                if autoSyncEnabled && !userEmail.isEmpty {
                    syncToDashboardSilently()
                }
            }
            
            // React to data changes
            .onChange(of: healthKitManager.latestHeartRate) { _ in
                if autoSyncEnabled {
                    syncToDashboardSilently()
                }
            }
        }
    }
```

### Health Data Section

```swift
private var healthDataSection: some View {
    HStack(spacing: 20) {
        // Heart Rate Card
        VStack {
            Image(systemName: "heart.fill")
                .font(.title)
                .foregroundColor(.red)
            
            // Conditional display
            if let heartRate = healthKitManager.latestHeartRate {
                Text("\(Int(heartRate))")
                    .font(.system(size: 40, weight: .bold))
                Text("BPM")
                    .foregroundColor(.secondary)
            } else {
                Text("--")
                    .font(.system(size: 40, weight: .bold))
            }
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(16)
        
        // Temperature Card (similar structure)
    }
}
```

### Sync Function

```swift
private func syncToDashboard() {
    guard !userEmail.isEmpty else {
        syncMessage = "Please enter your email"
        return
    }
    
    // Create payload
    let payload = WatchSyncPayload(
        apiKey: userEmail,
        heartRateBpm: healthKitManager.latestHeartRate,
        temperatureC: healthKitManager.latestTemperature,
        source: "AppleWatch_HealthKit",
        timestampUtc: ISO8601DateFormatter().string(from: Date())
    )
    
    // Call API
    apiService.syncData(to: dashboardURL, payload: payload) { result in
        switch result {
        case .success(let message):
            syncMessage = message
            lastSyncTime = Date()
        case .failure(let error):
            syncMessage = "Failed: \(error.localizedDescription)"
        }
    }
}
```

---

# Additional Judge Q&A

## API Questions

**Q: How does the iOS app authenticate with the backend?**
> Uses email as API key. The app sends the user's email in `apiKey` field. Backend looks up user by email using `UserManager.FindByEmailAsync()`.

**Q: Why use email instead of username/password?**
> Simpler for demo. Production would use JWT tokens or OAuth. Email-as-key works because registration already validates unique emails.

**Q: What HTTP status codes do you return?**
> - 200 OK - Success
> - 400 Bad Request - Missing/invalid data
> - 401 Unauthorized - Invalid API key or no session
> - 500 Internal Server Error - Server exception

**Q: Difference between MVC controller and API controller?**
> - `Controller` : Returns HTML Views, uses session cookies
> - `ControllerBase` + `[ApiController]` : Returns JSON only, stateless

---

## iOS/Swift Questions

**Q: What is @Published in SwiftUI?**
> Property wrapper that notifies observers when value changes. SwiftUI views automatically refresh when @Published properties change.

**Q: What is ObservableObject?**
> Protocol that allows a class to be observed by SwiftUI. Combined with @StateObject to create reactive data flow.

**Q: What is HealthKit?**
> Apple's framework for reading/writing health data. Requires user permission. Data comes from iPhone sensors, Apple Watch, and third-party apps.

**Q: Why use async/completion handlers?**
> Network requests and HealthKit queries are asynchronous - they take time and shouldn't block the UI. Completion handlers are called when the operation finishes.

**Q: What is `[weak self]` in closures?**
> Prevents memory leaks (retain cycles). Without it, the closure holds a strong reference to `self`, which might prevent the object from being deallocated.

**Q: How does the timer work for auto-sync?**
> `Timer.publish(every: 30)` creates a Combine publisher that fires every 30 seconds. `.onReceive(syncTimer)` subscribes to it and triggers the sync function.

---

## Data Flow: iOS App to Web Dashboard

```
┌─────────────────┐
│  Apple Watch    │
│  (Sensors)      │
└────────┬────────┘
         │ Automatic sync via Bluetooth
         ▼
┌─────────────────┐
│  HealthKit      │
│  (iOS Database) │
└────────┬────────┘
         │ HKSampleQuery
         ▼
┌─────────────────┐
│  iOS App        │
│  (Swift)        │
│  HealthKitMgr   │
└────────┬────────┘
         │ POST /api/health/watch-sync-key
         │ JSON payload
         ▼
┌─────────────────┐
│  ASP.NET Core   │
│  WatchSyncCtrl  │
└────────┬────────┘
         │ HealthDataService.SaveWatchData()
         ▼
┌─────────────────┐
│  In-Memory      │
│  Data Store     │
└────────┬────────┘
         │ LINQ queries
         ▼
┌─────────────────┐
│  Web Dashboard  │
│  (Browser)      │
│  apple-watch.js │
└─────────────────┘
```

---

## Complete Technology Stack Summary

| Layer | Technology | Files |
|-------|-----------|-------|
| **iOS App** | Swift, SwiftUI, HealthKit | *.swift |
| **Web Frontend** | Razor, HTML, Bootstrap | Views/*.cshtml |
| **Client Logic** | JavaScript, jQuery | wwwroot/js/*.js |
| **Device Connect** | Web Bluetooth API | web-bluetooth.js |
| **Backend** | ASP.NET Core MVC | Controllers/*.cs |
| **Auth** | ASP.NET Core Identity | AccountController.cs |
| **Database** | SQLite + EF Core | ApplicationDbContext.cs |
| **Data Layer** | C# with LINQ | HealthDataService.cs |
| **Styling** | CSS3 with Variables | dashboard.css |
| **APIs Created** | REST JSON | HealthController, WatchSyncController |
| **APIs Consumed** | disease.sh, Web Bluetooth | dashboard.js, web-bluetooth.js |

---

*End of Part 3 - Complete API and iOS/Swift Documentation*
