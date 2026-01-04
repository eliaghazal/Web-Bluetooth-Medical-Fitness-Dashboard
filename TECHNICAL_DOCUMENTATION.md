# Web Bluetooth Medical/Fitness Dashboard - Technical Documentation

## Project Overview
This is a comprehensive web application demonstrating advanced web technologies for a Web Programming final project. The application connects to physical hardware devices using the Web Bluetooth API and processes health data using multiple technologies.

## Technologies Used & Implementation

### 1. ASP.NET Core 6 MVC (C#)
**Location**: `HealthDashboard/` directory

**Files**:
- `Program.cs` - Application configuration and service registration
- `Controllers/HomeController.cs` - Main dashboard controller
- `Controllers/HealthController.cs` - Health data API controller
- `Models/` - DTOVM (Data Transfer Object View Model) pattern implementation

**Key Features**:
- Dependency Injection for `HealthDataService`
- MVC pattern implementation
- RESTful API endpoints
- View models for data transfer

### 2. LINQ (Language Integrated Query)
**Location**: `Services/HealthDataService.cs`

**LINQ Operations Demonstrated**:

```csharp
// GroupBy - Group readings by device ID
var readingsByDevice = _readings
    .GroupBy(r => r.DeviceId)
    .ToDictionary(g => g.Key, g => g.OrderByDescending(r => r.Timestamp).ToList());

// GroupBy with Average - Calculate averages by device type
var averages = _readings
    .GroupBy(r => r.DeviceType)
    .Where(g => g.Any())
    .ToDictionary(g => g.Key, g => g.Average(r => r.Value));

// Where clause - Filter readings by device type
var filtered = _readings
    .Where(r => r.DeviceType.Equals(deviceType, StringComparison.OrdinalIgnoreCase))
    .OrderByDescending(r => r.Timestamp)
    .ToList();

// OrderBy - Sort by timestamp
var sorted = _readings.OrderByDescending(r => r.Timestamp).ToList();

// Take - Limit results
var recent = _readings.OrderByDescending(r => r.Timestamp).Take(count).ToList();

// Min/Max/Count - Aggregation functions
var max = _readings.Any() ? _readings.Max(r => r.Timestamp) : null;
var count = _readings.Count;
```

**Advanced LINQ in Controller** (`Controllers/HealthController.cs`):
```csharp
// Complex aggregations in Analytics endpoint
ReadingsByHour = allReadings
    .GroupBy(r => r.Timestamp.Hour)
    .Select(g => new { Hour = g.Key, Count = g.Count() })
    .OrderBy(x => x.Hour)
    .ToList();

// Multiple grouping operations
RecentTrends = allReadings
    .Where(r => r.Timestamp >= DateTime.Now.AddHours(-24))
    .GroupBy(r => r.DeviceType)
    .Select(g => new { 
        Type = g.Key, 
        Average = g.Average(r => r.Value),
        Count = g.Count(),
        Latest = g.OrderByDescending(r => r.Timestamp).First().Value
    })
    .ToList();
```

### 3. LINQ to XML
**Location**: `Controllers/HealthController.cs` - `ExportXml()` method

```csharp
var xml = new XElement("HealthReadings",
    readings.Select(r => new XElement("Reading",
        new XElement("Id", r.Id),
        new XElement("DeviceId", r.DeviceId),
        new XElement("DeviceType", r.DeviceType),
        new XElement("Value", r.Value),
        new XElement("Unit", r.Unit),
        new XElement("Timestamp", r.Timestamp.ToString("o")),
        new XElement("Notes", r.Notes ?? "")
    ))
);
```

### 4. JSON Data Handling
**Implementation**: Multiple locations

**Export** (`Controllers/HealthController.cs`):
```csharp
var json = JsonSerializer.Serialize(readings, new JsonSerializerOptions 
{ 
    WriteIndented = true 
});
```

**API Endpoints**:
- `POST /Health/AddReading` - Accepts JSON data
- `GET /Health/GetReadings` - Returns JSON
- `GET /Health/Analytics` - Returns complex JSON analytics
- `POST /Health/ImportJson` - Imports JSON data

### 5. PHP Data Processing
**Location**: `wwwroot/php/health-processor.php`

**Features**:
- BMI calculation
- Heart rate classification
- Temperature analysis
- Health data aggregation
- JSON input/output

**Functions**:
```php
function calculateBMI($weight, $height)
function classifyHeartRate($heartRate, $age = 30)
function classifyTemperature($temp)
function analyzeHealthData($readings)
```

### 6. Web Bluetooth API
**Location**: `wwwroot/js/web-bluetooth.js`

**Implementation Details**:

**Heart Rate Monitor**:
```javascript
const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: ['heart_rate'] }],
    optionalServices: ['battery_service']
});
```

**Binary Data Parsing**:
```javascript
parseHeartRate(value) {
    const flags = value.getUint8(0);
    const rate16Bits = flags & 0x1;
    let heartRate;
    
    if (rate16Bits) {
        heartRate = value.getUint16(1, true);
    } else {
        heartRate = value.getUint8(1);
    }
    
    return heartRate;
}
```

**GATT Characteristics**:
- Standard Bluetooth services (heart_rate, health_thermometer)
- Real-time notifications
- Binary data stream handling
- Low-latency updates

### 7. jQuery & jQuery Animate
**Location**: `wwwroot/js/dashboard.js`

**jQuery Usage**:
```javascript
// DOM manipulation
$('#heartRateValue').text(value).hide().fadeIn(500);

// Event handlers
$('#connectHeartRate').on('click', function() { ... });

// AJAX calls
$.ajax({
    url: '/Health/AddReading',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(reading),
    success: function(response) { ... }
});

// Animations
$('.stat-card').animate({ opacity: 1 }, {
    duration: 500,
    step: function(now) {
        $(this).css('transform', `translateY(${20 - (now * 20)}px)`);
    }
});
```

**Animations**:
- Fade in/out effects
- Slide animations
- Pulse effects for real-time data
- Smooth transitions

### 8. HTML5
**Location**: `Views/Home/Index.cshtml`, `Views/Health/Index.cshtml`

**Semantic Elements**:
- `<header>`, `<nav>`, `<main>`, `<footer>`
- `<section>`, `<article>` for content organization
- Proper heading hierarchy (h1-h5)
- ARIA attributes for accessibility

### 9. CSS3
**Location**: `wwwroot/css/dashboard.css`

**Advanced Features**:
```css
/* Gradient backgrounds */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Animations */
@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

/* Transitions */
transition: all 0.3s ease;

/* Custom scrollbar */
::-webkit-scrollbar { ... }

/* Responsive design */
@media (max-width: 768px) { ... }
```

### 10. External API Integration
**Location**: `wwwroot/js/dashboard.js`

**APIs Used**:
1. **Health Quotes API** - Fetch health tips
2. **COVID-19 API** (disease.sh) - Global statistics
3. **Air Quality API** (OpenAQ) - Environmental data

```javascript
$.ajax({
    url: 'https://disease.sh/v3/covid-19/all',
    type: 'GET',
    success: function(data) {
        displayCovidWidget(data);
    }
});
```

## Technical Challenges Addressed

### 1. Binary Data Streams
**Challenge**: Parsing GATT characteristics from Bluetooth devices
**Solution**: Implemented proper data view parsing according to Bluetooth specifications

```javascript
parseHeartRate(value) {
    const flags = value.getUint8(0);
    const rate16Bits = flags & 0x1;
    return rate16Bits ? value.getUint16(1, true) : value.getUint8(1);
}
```

### 2. Low-Latency Visualization
**Challenge**: Real-time data updates without UI lag
**Solution**: 
- Efficient jQuery animations
- Debounced updates
- Optimized DOM manipulation

### 3. CORS Handling
**Challenge**: Cross-origin requests to external APIs
**Solution**: Proper CORS headers and error handling

## Project Structure

```
Web-Final/
├── README.md                           # Project documentation
├── .gitignore                          # Git ignore rules
└── HealthDashboard/                    # Main application
    ├── Controllers/
    │   ├── HomeController.cs           # Dashboard controller
    │   └── HealthController.cs         # API controller with LINQ
    ├── Models/
    │   ├── HealthReadingDto.cs         # Data transfer object
    │   ├── HealthDashboardViewModel.cs # View model
    │   └── DeviceConnectionDto.cs      # Connection DTO
    ├── Services/
    │   └── HealthDataService.cs        # LINQ operations
    ├── Views/
    │   ├── Home/
    │   │   └── Index.cshtml            # Main dashboard (HTML5)
    │   ├── Health/
    │   │   └── Index.cshtml            # Health data page
    │   └── Shared/
    │       └── _Layout.cshtml          # Layout template
    ├── wwwroot/
    │   ├── css/
    │   │   ├── dashboard.css           # Custom CSS3 styles
    │   │   └── site.css                # Base styles
    │   ├── js/
    │   │   ├── web-bluetooth.js        # Web Bluetooth API
    │   │   ├── dashboard.js            # jQuery & AJAX
    │   │   └── health-data.js          # Page-specific logic
    │   ├── php/
    │   │   └── health-processor.php    # PHP data processing
    │   └── lib/                        # Third-party libraries
    ├── Program.cs                      # Application startup
    └── HealthDashboard.csproj          # Project configuration
```

## API Endpoints

### Health Data API

**POST** `/Health/AddReading`
- Accepts: JSON (HealthReadingDto)
- Returns: Success/failure message

**GET** `/Health/GetReadings`
- Returns: All readings as JSON array

**GET** `/Health/GetReadingsByType?type={deviceType}`
- Returns: Filtered readings by device type

**GET** `/Health/GetStatistics`
- Returns: Aggregated statistics (LINQ queries)

**GET** `/Health/Analytics`
- Returns: Complex analytics with grouping

**GET** `/Health/ExportJson`
- Returns: All data as JSON file

**GET** `/Health/ExportXml`
- Returns: All data as XML file (LINQ to XML)

**POST** `/Health/ImportJson`
- Accepts: JSON array of readings
- Returns: Import status

**DELETE** `/Health/ClearAllReadings`
- Clears all stored data

## Running the Application

### Prerequisites
- .NET SDK 8.0 or higher (compatible with .NET 6+)
- Modern browser with Web Bluetooth support (Chrome, Edge, Opera)

### Build & Run
```bash
cd HealthDashboard
dotnet restore
dotnet build
dotnet run
```

### Access
Navigate to: `https://localhost:5001` or `http://localhost:5000`

## Course Requirements Fulfilled

✅ **HTML5**: Semantic markup throughout
✅ **CSS3**: Advanced styling with gradients and animations
✅ **jQuery**: DOM manipulation and AJAX
✅ **jQuery Animate**: Smooth UI transitions
✅ **ASP.NET Core 6 MVC**: Main framework (compatible with .NET 8)
✅ **C# with DTOVM**: Data Transfer Object View Model pattern
✅ **LINQ**: Extensive use of GroupBy, Where, OrderBy, Average, etc.
✅ **PHP**: Data processing script with health analytics
✅ **JSON**: API communication and data export
✅ **XML**: Data export using LINQ to XML
✅ **Web Bluetooth API**: Hardware connectivity
✅ **External APIs**: Multiple third-party integrations

## Security Considerations

1. **HTTPS Required**: Web Bluetooth only works on secure contexts
2. **User Consent**: All device connections require user interaction
3. **Input Validation**: Server-side validation on all endpoints
4. **CORS Configuration**: Properly configured for API access
5. **No Sensitive Data Storage**: In-memory storage only

## Future Enhancements

- Database integration for persistent storage
- User authentication and authorization
- Advanced data visualization with Chart.js
- Real-time SignalR updates
- Mobile app companion
- Export to PDF reports
- Email notifications for alerts

## Credits

**Author**: Elia Ghazal  
**Course**: Web Programming Final Project  
**Date**: January 2026

**Technologies**:
- ASP.NET Core MVC
- Web Bluetooth API
- jQuery & jQuery Animate
- Bootstrap 5
- Font Awesome
- PHP
- JSON/XML
