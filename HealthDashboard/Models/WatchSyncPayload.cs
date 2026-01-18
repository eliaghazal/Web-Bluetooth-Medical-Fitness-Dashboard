namespace HealthDashboard.Models;

/// <summary>
/// Payload received from iOS app when syncing Apple Watch data
/// </summary>
public class WatchSyncPayload
{
    /// <summary>
    /// API key for user authentication (optional if using session auth)
    /// </summary>
    public string? ApiKey { get; set; }
    
    /// <summary>
    /// Heart rate in beats per minute
    /// </summary>
    public double? HeartRateBpm { get; set; }
    
    /// <summary>
    /// Wrist temperature in Celsius (may be null if not available)
    /// </summary>
    public double? TemperatureC { get; set; }
    
    /// <summary>
    /// Source identifier (e.g., "AppleWatch_HealthKit")
    /// </summary>
    public string Source { get; set; } = "AppleWatch_HealthKit";
    
    /// <summary>
    /// Timestamp of the reading in UTC
    /// </summary>
    public DateTime? TimestampUtc { get; set; }
}

/// <summary>
/// Response sent back to iOS app after sync
/// </summary>
public class WatchSyncResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// Latest Apple Watch data for dashboard display
/// </summary>
public class WatchLatestData
{
    public double? HeartRateBpm { get; set; }
    public double? TemperatureC { get; set; }
    public bool HasTemperature { get; set; }
    public string Source { get; set; } = string.Empty;
    public DateTime? LastSyncUtc { get; set; }
}

/// <summary>
/// Stored Apple Watch data per user
/// </summary>
public class UserWatchData
{
    public string UserId { get; set; } = string.Empty;
    public double? HeartRateBpm { get; set; }
    public double? TemperatureC { get; set; }
    public string Source { get; set; } = string.Empty;
    public DateTime LastSyncUtc { get; set; }
}
