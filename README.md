# Web Bluetooth Medical/Fitness Dashboard

A comprehensive web application that connects directly to physical hardware (heart rate monitors, thermometers, ESP32 devices) using the **Web Bluetooth API**. This project demonstrates modern web technologies including ASP.NET Core 6 MVC, jQuery, Web Bluetooth API, and data processing with LINQ.

## 🎓 Academic Project
This is a final project for Web Programming course demonstrating:
- HTML5 & CSS3
- jQuery & jQuery Animate
- ASP.NET Core 6 MVC (C#)
- DTOVM (Data Transfer Object View Model) pattern
- LINQ (Language Integrated Query) with GroupBy and advanced queries
- PHP for additional data processing
- JSON & XML data handling
- Web Bluetooth API for hardware connectivity

## 🌟 Features

### Web Bluetooth Integration
- **Heart Rate Monitor Support**: Connect to standard Bluetooth LE heart rate monitors
- **Thermometer Support**: Connect to health thermometer devices
- **ESP32 Device Support**: Connect to custom ESP32-based sensors
- **Real-time Data Streaming**: Live data updates with low-latency visualization
- **Binary Data Handling**: Proper GATT characteristic parsing

### Data Management
- **Real-time Visualization**: Live charts and animated displays
- **Historical Data**: Store and retrieve past readings
- **LINQ Queries**: Advanced data aggregation and grouping
  - GroupBy device type
  - Average calculations
  - Filtering and sorting
  - Statistical analysis
- **Export Options**: 
  - JSON export
  - XML export (using LINQ to XML)
- **PHP Processing**: Additional server-side data analysis

### Beautiful UI
- **Modern Gradient Design**: Eye-catching color schemes
- **Smooth Animations**: jQuery animate effects
- **Responsive Layout**: Works on desktop and mobile
- **Real-time Updates**: Pulse animations for new data
- **Interactive Charts**: Visual data representation

### External API Integration
- **Health Tips**: Fetch health quotes from external APIs
- **COVID-19 Data**: Global statistics display
- **Air Quality**: Environmental health data

## 🛠️ Technologies Used

### Backend
- **ASP.NET Core 6 MVC**: Main application framework
- **C#**: Server-side programming
- **LINQ**: Data querying and manipulation
- **PHP**: Additional data processing

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Custom styling with gradients and animations
- **JavaScript (ES6+)**: Client-side logic
- **jQuery**: DOM manipulation and AJAX
- **jQuery Animate**: Smooth UI transitions
- **Web Bluetooth API**: Hardware connectivity
- **Bootstrap 5**: Responsive framework
- **Font Awesome**: Icons

### Data Formats
- **JSON**: API communication
- **XML**: Data export (LINQ to XML)

## 🚀 Getting Started

### Prerequisites
- .NET 6.0 SDK or higher
- A modern browser supporting Web Bluetooth API:
  - Chrome 56+
  - Edge 79+
  - Opera 43+
  - (Note: Firefox and Safari have limited support)

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/eliaghazal/Web-Final.git
cd Web-Final/HealthDashboard
```

2. **Restore dependencies**:
```bash
dotnet restore
```

3. **Build the project**:
```bash
dotnet build
```

4. **Run the application**:
```bash
dotnet run
```

5. **Access the application**:
Open your browser and navigate to:
```
https://localhost:5001
```

## 📱 Using Web Bluetooth

### Important Notes
- **HTTPS Required**: Web Bluetooth API only works on HTTPS or localhost
- **User Gesture**: Connection must be initiated by user interaction (button click)
- **Browser Support**: Use Chrome, Edge, or Opera for best results

### Connecting Devices

1. **Heart Rate Monitor**:
   - Click "Connect Heart Rate Monitor"
   - Select your Bluetooth LE heart rate monitor from the popup
   - View real-time BPM readings

2. **Thermometer**:
   - Click "Connect Thermometer"
   - Select your health thermometer device
   - Monitor temperature readings in Celsius

3. **ESP32 Device**:
   - Click "Connect ESP32 Device"
   - Select your ESP32-based sensor
   - Receive custom sensor data

### Simulated Data
If you don't have physical devices, the ESP32 connection includes simulated data for demonstration purposes.

## 💾 Data Features

### LINQ Operations Demonstrated
```csharp
// GroupBy device type
var readingsByDevice = readings.GroupBy(r => r.DeviceId)

// Average calculations
var averages = readings.GroupBy(r => r.DeviceType)
    .ToDictionary(g => g.Key, g => g.Average(r => r.Value))

// Filtering
var recent = readings.Where(r => r.Timestamp >= DateTime.Now.AddHours(-24))

// Ordering
var sorted = readings.OrderByDescending(r => r.Timestamp)
```

## 📊 Technical Challenges Addressed

1. **Binary Data Streams**: Proper parsing of GATT characteristics according to Bluetooth specifications
2. **Low-Latency Visualization**: Real-time updates with minimal delay
3. **CORS Handling**: Cross-origin requests for external APIs
4. **Data Persistence**: In-memory storage with LINQ queries
5. **Responsive UI**: Smooth animations without performance degradation

## 📝 Course Requirements Checklist

- [x] HTML5 semantic markup
- [x] CSS3 with custom styling
- [x] jQuery for DOM manipulation
- [x] jQuery Animate for transitions
- [x] ASP.NET Core 6 MVC
- [x] C# with DTOVM pattern
- [x] LINQ queries (GroupBy, Where, OrderBy, Average, etc.)
- [x] PHP for additional processing
- [x] JSON data handling
- [x] XML data handling (LINQ to XML)
- [x] Web Bluetooth API integration
- [x] External API integration

## 👨‍💻 Author

Elia Ghazal, William Ishak, George Khayat, and Bassam Farhat - Web Programming Final Project

---

**Note**: This is a demonstration project for academic purposes.
