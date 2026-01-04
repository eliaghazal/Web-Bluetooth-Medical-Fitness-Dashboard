using HealthDashboard.Models;

namespace HealthDashboard.Services;

public class HealthDataService
{
    private static List<HealthReadingDto> _readings = new();
    private static int _nextId = 1;

    public void AddReading(HealthReadingDto reading)
    {
        reading.Id = _nextId++;
        reading.Timestamp = DateTime.Now;
        _readings.Add(reading);
    }

    public List<HealthReadingDto> GetAllReadings()
    {
        // Using LINQ to order by timestamp descending
        return _readings.OrderByDescending(r => r.Timestamp).ToList();
    }

    public List<HealthReadingDto> GetRecentReadings(int count = 10)
    {
        // Using LINQ with Take
        return _readings.OrderByDescending(r => r.Timestamp).Take(count).ToList();
    }

    public Dictionary<string, List<HealthReadingDto>> GetReadingsGroupedByDevice()
    {
        // Using LINQ GroupBy
        return _readings
            .GroupBy(r => r.DeviceId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(r => r.Timestamp).ToList());
    }

    public Dictionary<string, double> GetAveragesByType()
    {
        // Using LINQ GroupBy with Average
        return _readings
            .GroupBy(r => r.DeviceType)
            .Where(g => g.Any())
            .ToDictionary(g => g.Key, g => g.Average(r => r.Value));
    }

    public List<HealthReadingDto> GetReadingsByDeviceType(string deviceType)
    {
        // Using LINQ Where clause
        return _readings
            .Where(r => r.DeviceType.Equals(deviceType, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(r => r.Timestamp)
            .ToList();
    }

    public HealthDashboardViewModel GetDashboardData()
    {
        // Using multiple LINQ queries
        var viewModel = new HealthDashboardViewModel
        {
            RecentReadings = GetRecentReadings(20),
            ReadingsByDevice = GetReadingsGroupedByDevice(),
            AveragesByType = GetAveragesByType(),
            TotalReadings = _readings.Count,
            LastReadingTime = _readings.Any() ? _readings.Max(r => r.Timestamp) : null
        };

        return viewModel;
    }

    public void ClearAllReadings()
    {
        _readings.Clear();
        _nextId = 1;
    }
}
