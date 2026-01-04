namespace HealthDashboard.Models;

public class DeviceConnectionDto
{
    public string DeviceId { get; set; } = string.Empty;
    public string DeviceName { get; set; } = string.Empty;
    public string DeviceType { get; set; } = string.Empty;
    public bool IsConnected { get; set; }
    public DateTime? ConnectedAt { get; set; }
}
