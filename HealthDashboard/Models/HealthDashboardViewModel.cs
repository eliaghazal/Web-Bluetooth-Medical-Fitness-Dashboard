namespace HealthDashboard.Models;

public class HealthDashboardViewModel
{
    public List<HealthReadingDto> RecentReadings { get; set; } = new();
    public Dictionary<string, List<HealthReadingDto>> ReadingsByDevice { get; set; } = new();
    public Dictionary<string, double> AveragesByType { get; set; } = new();
    public int TotalReadings { get; set; }
    public DateTime? LastReadingTime { get; set; }
}
