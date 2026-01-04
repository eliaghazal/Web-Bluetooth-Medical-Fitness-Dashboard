# Setup and Usage Guide

## Quick Start

### 1. Prerequisites
- **.NET SDK 8.0+** (or .NET 6.0+): [Download here](https://dotnet.microsoft.com/download)
- **Git**: For cloning the repository
- **Modern Browser**: Chrome, Edge, or Opera (for Web Bluetooth support)

### 2. Clone the Repository
```bash
git clone https://github.com/eliaghazal/Web-Final.git
cd Web-Final/HealthDashboard
```

### 3. Restore Dependencies
```bash
dotnet restore
```

### 4. Build the Project
```bash
dotnet build
```

### 5. Run the Application
```bash
dotnet run
```

The application will start and display:
```
Now listening on: http://localhost:5000
Now listening on: https://localhost:5001
```

### 6. Access the Dashboard
Open your browser and navigate to:
- **HTTPS** (recommended): https://localhost:5001
- **HTTP**: http://localhost:5000

## Using Web Bluetooth

### Important Notes
⚠️ **Web Bluetooth requires HTTPS or localhost**
⚠️ **User interaction required** - Connections must be initiated by button clicks
⚠️ **Browser support** - Use Chrome 56+, Edge 79+, or Opera 43+

### Connecting Devices

#### 1. Heart Rate Monitor
1. Turn on your Bluetooth LE heart rate monitor
2. Click "Connect Heart Rate Monitor" button
3. Select your device from the popup
4. View real-time BPM readings on the dashboard

**Compatible Devices**:
- Polar H10
- Wahoo TICKR
- Garmin heart rate straps
- Any Bluetooth LE heart rate monitor

#### 2. Thermometer
1. Turn on your health thermometer
2. Click "Connect Thermometer" button
3. Select your device from the popup
4. Monitor temperature readings

**Compatible Devices**:
- Bluetooth health thermometers
- Medical-grade temperature sensors

#### 3. ESP32 Device
1. Power on your ESP32 device
2. Click "Connect ESP32 Device" button
3. Select your device from the popup
4. View sensor data

**Note**: ESP32 includes simulated data for demonstration if custom services aren't available.

### Without Physical Devices
The application includes simulated data for ESP32 devices, allowing you to test all features without physical hardware.

## Features Guide

### Dashboard View
- **Live Data Cards**: Display real-time readings with animations
- **Statistics**: View aggregated data using LINQ queries
- **Recent Readings Table**: Last 20 readings
- **Export Options**: Download data as JSON or XML

### Health Data View
- **Quick Stats**: Overview of total records, devices, and types
- **Grouped Readings**: Data organized by device (LINQ GroupBy)
- **Complete Table**: All readings with sorting

### Data Export

#### JSON Export
Click "Export as JSON" to download all health data in JSON format:
```json
[
  {
    "id": 1,
    "deviceId": "device-123",
    "deviceType": "heart_rate",
    "value": 72.0,
    "unit": "BPM",
    "timestamp": "2026-01-04T19:40:00"
  }
]
```

#### XML Export
Click "Export as XML" to download all health data in XML format:
```xml
<HealthReadings>
  <Reading>
    <Id>1</Id>
    <DeviceId>device-123</DeviceId>
    <DeviceType>heart_rate</DeviceType>
    <Value>72.0</Value>
    <Unit>BPM</Unit>
    <Timestamp>2026-01-04T19:40:00</Timestamp>
  </Reading>
</HealthReadings>
```

### Analytics Dashboard
Click "View Analytics" to see:
- Readings distribution by hour
- Readings count by device
- 24-hour trends with averages

## API Usage

### Add a Reading
```bash
curl -X POST https://localhost:5001/Health/AddReading \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "test-device",
    "deviceType": "heart_rate",
    "value": 75,
    "unit": "BPM",
    "notes": "Test reading"
  }'
```

### Get All Readings
```bash
curl https://localhost:5001/Health/GetReadings
```

### Get Statistics
```bash
curl https://localhost:5001/Health/GetStatistics
```

### Get Analytics
```bash
curl https://localhost:5001/Health/Analytics
```

## PHP Processor

The PHP processor is located at `wwwroot/php/health-processor.php` and can be used independently for data analysis.

### Using PHP Processor

#### Get Sample Analysis
```bash
curl http://localhost:8000/php/health-processor.php
```

#### Calculate BMI
```bash
curl "http://localhost:8000/php/health-processor.php?calculate_bmi=1&weight=70&height=1.75"
```

#### Post Health Data for Analysis
```bash
curl -X POST http://localhost:8000/php/health-processor.php \
  -H "Content-Type: application/json" \
  -d '{
    "readings": [
      {"deviceType": "heart_rate", "value": 72},
      {"deviceType": "thermometer", "value": 36.8}
    ]
  }'
```

## Troubleshooting

### Web Bluetooth Not Available
**Problem**: "Web Bluetooth API is not available" message
**Solution**: 
- Use Chrome, Edge, or Opera browser
- Ensure you're on HTTPS or localhost
- Check browser version (Chrome 56+, Edge 79+, Opera 43+)

### Cannot Connect to Device
**Problem**: Device doesn't appear in selection popup
**Solution**:
- Ensure device is powered on and in pairing mode
- Check device battery
- Move closer to the device
- Restart Bluetooth on your computer
- Try refreshing the page

### Port Already in Use
**Problem**: "Address already in use" error
**Solution**:
```bash
# Find process using port 5000/5001
netstat -ano | findstr :5000  # Windows
lsof -i :5000                  # Linux/Mac

# Kill the process and try again
```

### Build Errors
**Problem**: Build fails with missing dependencies
**Solution**:
```bash
# Clean and restore
dotnet clean
dotnet restore
dotnet build
```

### External APIs Not Working
**Problem**: COVID-19 or other external data not showing
**Solution**: This is expected if network restrictions block external domains. The core functionality still works without external APIs.

## Browser Compatibility

### Fully Supported
✅ Google Chrome 56+
✅ Microsoft Edge 79+
✅ Opera 43+

### Partially Supported
⚠️ Firefox (Web Bluetooth behind flag)
⚠️ Safari (Limited Web Bluetooth support)

### Not Supported
❌ Internet Explorer

## Development Tips

### Hot Reload
For development with hot reload:
```bash
dotnet watch run
```

### Debug Mode
The application runs in Development mode by default when using `dotnet run`.

### Custom Port
```bash
dotnet run --urls="http://localhost:8080"
```

### Production Build
```bash
dotnet publish -c Release -o ./publish
```

## Project Demo

### Testing Without Devices
1. Open the dashboard
2. Click "Connect ESP32 Device"
3. Select any Bluetooth device (simulated data will be generated)
4. Watch the dashboard update with animated values
5. View statistics updating in real-time
6. Export data to JSON or XML
7. Check the Health Data page for grouped readings

### Full Device Testing
1. Connect a Bluetooth heart rate monitor
2. Start monitoring your heart rate
3. Perform light exercise
4. Watch real-time BPM updates
5. Review historical data
6. Export and analyze your data

## Support

For issues or questions:
- Check the TECHNICAL_DOCUMENTATION.md
- Review error messages in browser console (F12)
- Ensure all prerequisites are met
- Verify browser compatibility

## License

This project is for educational purposes as part of a Web Programming course.
