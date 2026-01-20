# Web Bluetooth Medical/Fitness Dashboard

A web application that connects to physical health devices using the **Web Bluetooth API** and syncs data from **Apple Watch via HealthKit**. Built with ASP.NET Core MVC, jQuery, and Bootstrap.

---

## 🎓 Course Topics Demonstrated

This project demonstrates the following topics covered in class:

### Web Fundamentals & Data Formats
- **jQuery & HTML** - DOM manipulation, event handling, AJAX calls
- **JSON** - Data serialization/deserialization, API communication
- **XML** - Export functionality using LINQ to XML

### C# & .NET
- **ASP.NET Core MVC** - Controllers, Views, Models
- **Entity Framework** - SQLite database with Identity
- **LINQ** - GroupBy, Where, OrderBy, Average, Select queries

### State Management
- **Session-based Authentication** - ASP.NET Core Identity
- **Cookie Authentication** - Remember me functionality

---

## 🌟 Key Features

### 1. Web Bluetooth API
Connect to Bluetooth LE health devices directly from the browser:
- Heart Rate Monitors
- Thermometers  
- ESP32 Sensors

### 2. Apple Watch Sync
Sync health data from Apple Watch via iOS companion app:
- Heart Rate from HealthKit
- Wrist Temperature (Series 8+)

### 3. COVID-19 API
Fetches global COVID-19 statistics from external API.

### 4. Data Export
- Export as JSON
- Export as XML (using LINQ to XML)

---

## 🚀 Quick Start

```bash
cd HealthDashboard
dotnet restore
dotnet build
dotnet run
```

Access at: `http://localhost:5000`

---

## 📱 Using Web Bluetooth

⚠️ **Requirements:**
- Chrome, Edge, or Opera browser
- HTTPS or localhost
- User must click a button to initiate connection

### Connect a Device:
1. Click "Connect Heart Rate Monitor" (or other device button)
2. Select your device from the popup
3. View real-time data on the dashboard

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/Health/AddReading` | Add a health reading (JSON) |
| `GET` | `/Health/GetReadings` | Get all readings |
| `GET` | `/Health/Analytics` | Get analytics with LINQ |
| `GET` | `/Health/ExportJson` | Download as JSON |
| `GET` | `/Health/ExportXml` | Download as XML |
| `DELETE` | `/Health/ClearAllReadings` | Clear all data |

---

## 🛠️ Technologies

| Category | Technologies |
|----------|-------------|
| **Backend** | ASP.NET Core MVC (.NET 10.0), C#, LINQ, Entity Framework |
| **Frontend** | HTML5, CSS3, jQuery, Bootstrap 5, Web Bluetooth API |
| **Data Formats** | JSON, XML |
| **Database** | SQLite |

---

## 👨‍💻 Authors

**Elia Ghazal, William Ishak, George Khayat, and Bassam Farhat**  
CSI418L - Web Programming Lab Expo Final Project
