namespace HealthDashboard.Models;

public class HealthReadingDto
{
    public int Id { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public string DeviceType { get; set; } = string.Empty;
    public double Value { get; set; }
    public string Unit { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string? Notes { get; set; }
}
