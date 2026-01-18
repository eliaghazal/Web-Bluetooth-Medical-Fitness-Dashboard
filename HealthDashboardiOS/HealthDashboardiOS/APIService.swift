import Foundation

/// Payload to send to the backend API
struct WatchSyncPayload: Codable {
    let apiKey: String?
    let heartRateBpm: Double?
    let temperatureC: Double?
    let source: String
    let timestampUtc: String
}

/// Response from the backend API
struct WatchSyncResponse: Codable {
    let success: Bool
    let message: String
}

/// Service for communicating with the Health Dashboard backend
class APIService: ObservableObject {
    @Published var isLoading = false
    @Published var lastError: String?
    
    /// Sync health data to the dashboard backend
    func syncData(to baseURL: String, payload: WatchSyncPayload, completion: @escaping (Result<String, Error>) -> Void) {
        isLoading = true
        lastError = nil
        
        // Build the URL
        let urlString = "\(baseURL)/api/health/watch-sync-key"
        guard let url = URL(string: urlString) else {
            isLoading = false
            completion(.failure(APIError.invalidURL))
            return
        }
        
        // Create the request
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Encode the payload
        do {
            let encoder = JSONEncoder()
            request.httpBody = try encoder.encode(payload)
        } catch {
            isLoading = false
            completion(.failure(error))
            return
        }
        
        // Make the request
        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            DispatchQueue.main.async {
                self?.isLoading = false
                
                if let error = error {
                    self?.lastError = error.localizedDescription
                    completion(.failure(error))
                    return
                }
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    completion(.failure(APIError.invalidResponse))
                    return
                }
                
                guard let data = data else {
                    completion(.failure(APIError.noData))
                    return
                }
                
                // Parse the response
                do {
                    let decoder = JSONDecoder()
                    let response = try decoder.decode(WatchSyncResponse.self, from: data)
                    
                    if response.success {
                        completion(.success(response.message))
                    } else {
                        self?.lastError = response.message
                        completion(.failure(APIError.serverError(response.message)))
                    }
                } catch {
                    // Try to get error message from response
                    if let errorString = String(data: data, encoding: .utf8) {
                        self?.lastError = errorString
                        completion(.failure(APIError.serverError(errorString)))
                    } else {
                        completion(.failure(error))
                    }
                }
            }
        }.resume()
    }
}

/// API-related errors
enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case noData
    case serverError(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid server response"
        case .noData:
            return "No data received"
        case .serverError(let message):
            return message
        }
    }
}
