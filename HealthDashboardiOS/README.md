# Health Dashboard iOS Companion App

SwiftUI app for syncing Apple Watch health data (via HealthKit) to the Health Dashboard web application.

## Features

- ✅ Request HealthKit permissions
- ✅ Read Heart Rate (latest sample)
- ✅ Read Wrist Temperature (sleep data, iOS 16+, Apple Watch Series 8+)
- ✅ Display latest values in app
- ✅ Sync to backend API with one tap
- ✅ Mock mode for simulator testing

## Architecture

```
Apple Watch → iPhone HealthKit → This App → Backend API → Web Dashboard
```

## Setup Instructions

### 1. Open in Xcode

Open the `HealthDashboardiOS` folder in Xcode (File → Open → Select folder).

If you don't see a `.xcodeproj` file, create a new SwiftUI project in Xcode:
1. File → New → Project
2. Select iOS → App
3. Product Name: `HealthDashboardiOS`
4. Interface: SwiftUI
5. Language: Swift
6. Save to this folder
7. Delete the generated ContentView.swift and add the files from this folder

### 2. Add HealthKit Capability

1. Select the project in the navigator
2. Select the target → Signing & Capabilities
3. Click "+ Capability"
4. Add "HealthKit"
5. Check "Clinical Health Records" if needed

### 3. Configure Signing

1. Select your development team
2. Ensure bundle identifier is unique (e.g., `com.yourname.HealthDashboardiOS`)

### 4. Configure the App

Before running:
1. Open `ContentView.swift`
2. Update `dashboardURL` to your actual dashboard URL
3. Or configure it in the Settings screen after launching

### 5. Build & Run

- **Real Device**: Build and run on a real iPhone with Apple Watch paired
- **Simulator**: Use mock data mode (HealthKit has no data on simulator)

## Usage

1. Launch the app
2. Tap "Request HealthKit Access" and grant permissions
3. View the latest Heart Rate and Wrist Temperature
4. Open Settings (gear icon) and enter your dashboard login email
5. Tap "Sync to Dashboard"
6. Check your web dashboard - data should appear!

## HealthKit Data Types

| Data | Identifier | Notes |
|------|------------|-------|
| Heart Rate | `HKQuantityTypeIdentifier.heartRate` | BPM, latest sample |
| Wrist Temperature | `HKQuantityTypeIdentifier.appleSleepingWristTemperature` | °C, sleep data only, iOS 16+ |

## Wrist Temperature Notes

⚠️ **Important**: Wrist temperature is only available:
- On Apple Watch Series 8 or later
- After sleeping with the watch on
- With iOS 16.0 or later

If unavailable, the app will show "N/A" gracefully.

## API Endpoint

The app sends data to:
```
POST /api/health/watch-sync-key
```

Payload:
```json
{
  "apiKey": "user@email.com",
  "heartRateBpm": 72,
  "temperatureC": 36.5,
  "source": "AppleWatch_HealthKit",
  "timestampUtc": "2026-01-18T00:00:00Z"
}
```

## Troubleshooting

### "HealthKit Not Available"
- HealthKit is not available on iPad or Mac Catalyst
- Run on real iPhone

### "No Temperature Data"
- You need Apple Watch Series 8+
- Sleep with watch to collect wrist temp data
- Temperature is NOT real-time - it's collected during sleep

### "Sync Failed"
- Check your internet connection
- Verify the dashboard URL is correct
- Ensure you entered the correct email
- Check if the web app is running

## Files

```
HealthDashboardiOS/
├── HealthDashboardiOSApp.swift    # App entry point
├── ContentView.swift               # Main UI
├── HealthKitManager.swift          # HealthKit queries
├── APIService.swift                # Backend sync
├── Info.plist                      # App configuration
└── HealthDashboardiOS.entitlements # HealthKit capability
```

## Requirements

- iOS 15.0+
- Xcode 14.0+
- Apple Developer Account (for HealthKit)
- Real iPhone device (for real HealthKit data)
- Apple Watch paired (for watch data)
