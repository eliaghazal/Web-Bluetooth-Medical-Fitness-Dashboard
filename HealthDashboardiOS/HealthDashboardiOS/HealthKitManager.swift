import Foundation
import Combine
import HealthKit

/// Manages HealthKit authorization and data queries
class HealthKitManager: ObservableObject {
    private let healthStore = HKHealthStore()
    private var observerQuery: HKObserverQuery?
    private var refreshTimer: Timer?
    
    @Published var isAuthorized = false
    @Published var latestHeartRate: Double?
    @Published var latestTemperature: Double?
    @Published var errorMessage: String?
    @Published var lastDataUpdate: Date?
    
    init() {
        checkAuthorizationStatus()
    }
    
    deinit {
        stopObserving()
    }
    
    // MARK: - Authorization
    
    /// Check if HealthKit is available on this device
    var isHealthKitAvailable: Bool {
        HKHealthStore.isHealthDataAvailable()
    }
    
    /// Request authorization to read health data
    func requestAuthorization() {
        guard isHealthKitAvailable else {
            errorMessage = "HealthKit is not available on this device"
            return
        }
        
        // Define the types we want to read
        var typesToRead: Set<HKObjectType> = [
            HKObjectType.quantityType(forIdentifier: .heartRate)!
        ]
        
        // Add wrist temperature if available (iOS 16+)
        if #available(iOS 16.0, *) {
            if let wristTemp = HKObjectType.quantityType(forIdentifier: .appleSleepingWristTemperature) {
                typesToRead.insert(wristTemp)
            }
        }
        
        healthStore.requestAuthorization(toShare: nil, read: typesToRead) { [weak self] success, error in
            DispatchQueue.main.async {
                if success {
                    self?.isAuthorized = true
                    self?.fetchLatestData()
                    self?.startObserving()
                    self?.startAutoRefreshTimer()
                } else if let error = error {
                    self?.errorMessage = error.localizedDescription
                    self?.isAuthorized = false
                }
            }
        }
    }
    
    /// Check current authorization status
    private func checkAuthorizationStatus() {
        guard isHealthKitAvailable else { return }
        
        guard let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate) else { return }
        
        let status = healthStore.authorizationStatus(for: heartRateType)
        DispatchQueue.main.async {
            self.isAuthorized = status == .sharingAuthorized
            if self.isAuthorized {
                self.startObserving()
                self.startAutoRefreshTimer()
            }
        }
    }
    
    // MARK: - Observer Query (Real-time updates)
    
    /// Start observing HealthKit for new heart rate data
    private func startObserving() {
        guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) else { return }
        
        // Stop any existing observer
        stopObserving()
        
        observerQuery = HKObserverQuery(sampleType: heartRateType, predicate: nil) { [weak self] _, completionHandler, error in
            if error != nil {
                completionHandler()
                return
            }
            
            // New data available - fetch it
            DispatchQueue.main.async {
                self?.fetchLatestData()
                print("HealthKit observer triggered - new data available")
            }
            completionHandler()
        }
        
        if let query = observerQuery {
            healthStore.execute(query)
            print("Started observing HealthKit for heart rate changes")
        }
    }
    
    /// Stop observing HealthKit
    private func stopObserving() {
        if let query = observerQuery {
            healthStore.stop(query)
            observerQuery = nil
        }
        refreshTimer?.invalidate()
        refreshTimer = nil
    }
    
    // MARK: - Auto-Refresh Timer
    
    /// Start a timer to refresh data every 10 seconds
    private func startAutoRefreshTimer() {
        refreshTimer?.invalidate()
        refreshTimer = Timer.scheduledTimer(withTimeInterval: 10.0, repeats: true) { [weak self] _ in
            self?.fetchLatestData()
            print("Auto-refresh timer triggered")
        }
    }
    
    // MARK: - Data Fetching
    
    /// Fetch the latest health data from HealthKit
    func fetchLatestData() {
        fetchLatestHeartRate()
        fetchLatestTemperature()
    }
    
    /// Fetch the most recent heart rate sample
    private func fetchLatestHeartRate() {
        guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) else { return }
        
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let query = HKSampleQuery(
            sampleType: heartRateType,
            predicate: nil,
            limit: 1,
            sortDescriptors: [sortDescriptor]
        ) { [weak self] _, samples, error in
            DispatchQueue.main.async {
                if let error = error {
                    self?.errorMessage = error.localizedDescription
                    return
                }
                
                guard let sample = samples?.first as? HKQuantitySample else {
                    self?.latestHeartRate = nil
                    return
                }
                
                // Convert to BPM
                let heartRate = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
                self?.latestHeartRate = heartRate
                self?.lastDataUpdate = Date()
            }
        }
        
        healthStore.execute(query)
    }
    
    /// Fetch the most recent wrist temperature (iOS 16+ only, from sleep data)
    private func fetchLatestTemperature() {
        guard #available(iOS 16.0, *) else {
            DispatchQueue.main.async {
                self.latestTemperature = nil
            }
            return
        }
        
        guard let tempType = HKQuantityType.quantityType(forIdentifier: .appleSleepingWristTemperature) else {
            DispatchQueue.main.async {
                self.latestTemperature = nil
            }
            return
        }
        
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let query = HKSampleQuery(
            sampleType: tempType,
            predicate: nil,
            limit: 1,
            sortDescriptors: [sortDescriptor]
        ) { [weak self] _, samples, error in
            DispatchQueue.main.async {
                if let error = error {
                    print("Temperature fetch error: \(error.localizedDescription)")
                    self?.latestTemperature = nil
                    return
                }
                
                guard let sample = samples?.first as? HKQuantitySample else {
                    self?.latestTemperature = nil
                    return
                }
                
                // Convert to Celsius
                let temperature = sample.quantity.doubleValue(for: .degreeCelsius())
                self?.latestTemperature = temperature
            }
        }
        
        healthStore.execute(query)
    }
    
    // MARK: - Mock Data (for Simulator)
    
    /// Generate mock data for testing on simulator
    func useMockData() {
        DispatchQueue.main.async {
            self.latestHeartRate = Double.random(in: 60...100)
            self.latestTemperature = Double.random(in: 36.0...37.5)
            self.isAuthorized = true
        }
    }
}
