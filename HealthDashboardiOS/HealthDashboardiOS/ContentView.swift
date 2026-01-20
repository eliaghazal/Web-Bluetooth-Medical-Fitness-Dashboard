import SwiftUI

struct ContentView: View {
    @StateObject private var healthKitManager = HealthKitManager()
    @StateObject private var apiService = APIService()
    
    @State private var dashboardURL = "http://192.168.1.16:5253"
    @State private var userEmail = ""
    @State private var showingSettings = false
    @State private var syncMessage = ""
    @State private var isShowingMessage = false
    @State private var autoSyncEnabled = true
    @State private var lastSyncTime: Date?
    
    // Timer for auto-sync every 30 seconds
    let syncTimer = Timer.publish(every: 30, on: .main, in: .common).autoconnect()
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    headerSection
                    
                    // Auto-sync status
                    autoSyncStatusSection
                    
                    // HealthKit Authorization
                    authorizationSection
                    
                    // Health Data Display
                    if healthKitManager.isAuthorized {
                        healthDataSection
                    }
                    
                    // Sync Button
                    if healthKitManager.isAuthorized {
                        syncSection
                    }
                    
                    // Settings
                    settingsSection
                    
                    Spacer()
                }
                .padding()
            }
            .navigationTitle("Health Dashboard")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingSettings.toggle() }) {
                        Image(systemName: "gear")
                    }
                }
            }
            .sheet(isPresented: $showingSettings) {
                SettingsView(dashboardURL: $dashboardURL, userEmail: $userEmail, autoSyncEnabled: $autoSyncEnabled)
            }
            .alert("Sync Status", isPresented: $isShowingMessage) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(syncMessage)
            }
            // Auto-sync on app launch
            .onAppear {
                if autoSyncEnabled && !userEmail.isEmpty && healthKitManager.isAuthorized {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                        syncToDashboardSilently()
                    }
                }
            }
            // Auto-sync every 30 seconds
            .onReceive(syncTimer) { _ in
                if autoSyncEnabled && !userEmail.isEmpty && healthKitManager.isAuthorized {
                    healthKitManager.fetchLatestData()
                    syncToDashboardSilently()
                }
            }
            // Sync when health data changes
            .onChange(of: healthKitManager.latestHeartRate) { _ in
                if autoSyncEnabled && !userEmail.isEmpty {
                    syncToDashboardSilently()
                }
            }
        }
    }
    
    // MARK: - Auto-Sync Status Section
    private var autoSyncStatusSection: some View {
        HStack {
            Image(systemName: autoSyncEnabled ? "arrow.triangle.2.circlepath.circle.fill" : "arrow.triangle.2.circlepath.circle")
                .foregroundColor(autoSyncEnabled ? .green : .gray)
            Text(autoSyncEnabled ? "Auto-Sync: ON" : "Auto-Sync: OFF")
                .font(.caption)
                .fontWeight(.medium)
            Spacer()
            if let lastSync = lastSyncTime {
                Text("Last: \(lastSync, formatter: timeFormatter)")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(UIColor.systemGray6))
        .cornerRadius(8)
    }
    
    private var timeFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.timeStyle = .medium
        return formatter
    }
    
    // MARK: - Header Section
    private var headerSection: some View {
        VStack(spacing: 8) {
            Image(systemName: "applewatch")
                .font(.system(size: 60))
                .foregroundColor(.blue)
            
            Text("Apple Watch Sync")
                .font(.title2)
                .fontWeight(.bold)
            
            Text("Sync your HealthKit data to the web dashboard")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
    
    // MARK: - Authorization Section
    private var authorizationSection: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: healthKitManager.isAuthorized ? "checkmark.circle.fill" : "xmark.circle.fill")
                    .foregroundColor(healthKitManager.isAuthorized ? .green : .red)
                Text(healthKitManager.isAuthorized ? "HealthKit Authorized" : "HealthKit Not Authorized")
                    .fontWeight(.medium)
            }
            
            if !healthKitManager.isAuthorized {
                Button {
                    print("Button tapped - requesting HealthKit authorization")
                    healthKitManager.requestAuthorization()
                } label: {
                    HStack {
                        Image(systemName: "heart.fill")
                        Text("Request HealthKit Access")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .buttonStyle(.plain)
                .contentShape(Rectangle())
            }
        }
        .padding()
        .background(Color(UIColor.systemGray6))
        .cornerRadius(16)
    }
    
    // MARK: - Health Data Section
    private var healthDataSection: some View {
        VStack(spacing: 16) {
            Text("Latest Health Data")
                .font(.headline)
            
            HStack(spacing: 20) {
                // Heart Rate Card
                VStack(spacing: 8) {
                    Image(systemName: "heart.fill")
                        .font(.title)
                        .foregroundColor(.red)
                    
                    if let heartRate = healthKitManager.latestHeartRate {
                        Text("\(Int(heartRate))")
                            .font(.system(size: 40, weight: .bold))
                        Text("BPM")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    } else {
                        Text("--")
                            .font(.system(size: 40, weight: .bold))
                        Text("No data")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(16)
                
                // Temperature Card
                VStack(spacing: 8) {
                    Image(systemName: "thermometer")
                        .font(.title)
                        .foregroundColor(.orange)
                    
                    if let temp = healthKitManager.latestTemperature {
                        Text(String(format: "%.1f", temp))
                            .font(.system(size: 40, weight: .bold))
                        Text("°C")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    } else {
                        Text("N/A")
                            .font(.system(size: 40, weight: .bold))
                        Text("Sleep data only")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(16)
            }
            
            Button(action: {
                healthKitManager.fetchLatestData()
            }) {
                HStack {
                    Image(systemName: "arrow.clockwise")
                    Text("Refresh Data")
                }
                .font(.subheadline)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.1), radius: 5)
    }
    
    // MARK: - Sync Section
    private var syncSection: some View {
        VStack(spacing: 12) {
            Button(action: syncToDashboard) {
                HStack {
                    if apiService.isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Image(systemName: "arrow.up.circle.fill")
                    }
                    Text("Sync to Dashboard")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.green)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
            .disabled(apiService.isLoading || userEmail.isEmpty)
            
            if userEmail.isEmpty {
                Text("⚠️ Enter your email in Settings to sync")
                    .font(.caption)
                    .foregroundColor(.orange)
            }
        }
    }
    
    // MARK: - Settings Section
    private var settingsSection: some View {
        VStack(spacing: 8) {
            HStack {
                Text("Dashboard URL:")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                Text(dashboardURL)
                    .font(.caption)
                    .lineLimit(1)
            }
            
            HStack {
                Text("User Email:")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                Text(userEmail.isEmpty ? "Not set" : userEmail)
                    .font(.caption)
                    .foregroundColor(userEmail.isEmpty ? .orange : .primary)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
    
    // MARK: - Sync Action
    private func syncToDashboard() {
        guard !userEmail.isEmpty else {
            syncMessage = "Please enter your email in Settings"
            isShowingMessage = true
            return
        }
        
        let payload = WatchSyncPayload(
            apiKey: userEmail,
            heartRateBpm: healthKitManager.latestHeartRate,
            temperatureC: healthKitManager.latestTemperature,
            source: "AppleWatch_HealthKit",
            timestampUtc: ISO8601DateFormatter().string(from: Date())
        )
        
        apiService.syncData(to: dashboardURL, payload: payload) { result in
            switch result {
            case .success(let message):
                syncMessage = message
                lastSyncTime = Date()
            case .failure(let error):
                syncMessage = "Sync failed: \(error.localizedDescription)"
            }
            isShowingMessage = true
        }
    }
    
    // Silent sync (no alerts - for auto-sync)
    private func syncToDashboardSilently() {
        guard !userEmail.isEmpty else { return }
        
        let payload = WatchSyncPayload(
            apiKey: userEmail,
            heartRateBpm: healthKitManager.latestHeartRate,
            temperatureC: healthKitManager.latestTemperature,
            source: "AppleWatch_HealthKit",
            timestampUtc: ISO8601DateFormatter().string(from: Date())
        )
        
        apiService.syncData(to: dashboardURL, payload: payload) { result in
            if case .success = result {
                lastSyncTime = Date()
                print("Auto-sync successful at \(Date())")
            } else {
                print("Auto-sync failed")
            }
        }
    }
}

// MARK: - Settings View
struct SettingsView: View {
    @Binding var dashboardURL: String
    @Binding var userEmail: String
    @Binding var autoSyncEnabled: Bool
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Dashboard Configuration")) {
                    TextField("Dashboard URL", text: $dashboardURL)
                        .autocapitalization(.none)
                        .keyboardType(.URL)
                    
                    TextField("Your Email (API Key)", text: $userEmail)
                        .autocapitalization(.none)
                        .keyboardType(.emailAddress)
                }
                
                Section(header: Text("Auto-Sync")) {
                    Toggle("Auto-Sync Every 30 Seconds", isOn: $autoSyncEnabled)
                    
                    Text("When enabled, the app will automatically sync your health data to the dashboard every 30 seconds while the app is open.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Section(header: Text("Info")) {
                    Text("Enter the email you use to log into the Health Dashboard. This is used to identify your account when syncing data.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .navigationTitle("Settings")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    ContentView()
}
