using HealthDashboard.Models;

namespace HealthDashboard.Services;

public class HealthDataService
{
    private static List<HealthReadingDto> _readings = new();
    private static int _nextId = 1;

    public void AddReading(HealthReadingDto reading, string userId)
    {
        reading.Id = _nextId++;
        reading.UserId = userId;
        reading.Timestamp = DateTime.Now;
        _readings.Add(reading);
    }

    public List<HealthReadingDto> GetAllReadings(string userId)
    {
        // Using LINQ to filter by user and order by timestamp descending
        return _readings
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.Timestamp)
            .ToList();
    }

    public List<HealthReadingDto> GetRecentReadings(string userId, int count = 10)
    {
        // Using LINQ with Where, OrderBy and Take
        return _readings
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.Timestamp)
            .Take(count)
            .ToList();
    }

    public Dictionary<string, List<HealthReadingDto>> GetReadingsGroupedByDevice(string userId)
    {
        // Using LINQ GroupBy - filtered by user
        return _readings
            .Where(r => r.UserId == userId)
            .GroupBy(r => r.DeviceId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(r => r.Timestamp).ToList());
    }

    public Dictionary<string, double> GetAveragesByType(string userId)
    {
        // Using LINQ GroupBy with Average - filtered by user
        return _readings
            .Where(r => r.UserId == userId)
            .GroupBy(r => r.DeviceType)
            .Where(g => g.Any())
            .ToDictionary(g => g.Key, g => g.Average(r => r.Value));
    }

    public List<HealthReadingDto> GetReadingsByDeviceType(string userId, string deviceType)
    {
        // Using LINQ Where clause - filtered by user
        return _readings
            .Where(r => r.UserId == userId && r.DeviceType.Equals(deviceType, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(r => r.Timestamp)
            .ToList();
    }

    public HealthDashboardViewModel GetDashboardData(string userId)
    {
        // Using multiple LINQ queries - all filtered by user
        var userReadings = _readings.Where(r => r.UserId == userId).ToList();
        
        var viewModel = new HealthDashboardViewModel
        {
            RecentReadings = GetRecentReadings(userId, 20),
            ReadingsByDevice = GetReadingsGroupedByDevice(userId),
            AveragesByType = GetAveragesByType(userId),
            TotalReadings = userReadings.Count,
            LastReadingTime = userReadings.Any() ? userReadings.Max(r => r.Timestamp) : null
        };

        return viewModel;
    }

    public void ClearAllReadings(string userId)
    {
        // Only clear readings for the specific user
        _readings.RemoveAll(r => r.UserId == userId);
    }
} 
