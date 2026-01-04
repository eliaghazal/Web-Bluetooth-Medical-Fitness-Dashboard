using Microsoft.AspNetCore.Mvc;
using HealthDashboard.Models;
using HealthDashboard.Services;
using System.Xml.Linq;
using System.Text.Json;

namespace HealthDashboard.Controllers;

public class HealthController : Controller
{
    private readonly HealthDataService _healthDataService;

    public HealthController(HealthDataService healthDataService)
    {
        _healthDataService = healthDataService;
    }

    public IActionResult Index()
    {
        var dashboardData = _healthDataService.GetDashboardData();
        return View(dashboardData);
    }

    [HttpPost]
    public IActionResult AddReading([FromBody] HealthReadingDto reading)
    {
        if (ModelState.IsValid)
        {
            _healthDataService.AddReading(reading);
            return Json(new { success = true, message = "Reading added successfully" });
        }
        return Json(new { success = false, message = "Invalid data" });
    }

    [HttpGet]
    public IActionResult GetReadings()
    {
        var readings = _healthDataService.GetAllReadings();
        return Json(readings);
    }

    [HttpGet]
    public IActionResult GetReadingsByType(string type)
    {
        // Using LINQ to filter by device type
        var readings = _healthDataService.GetReadingsByDeviceType(type);
        return Json(readings);
    }

    [HttpGet]
    public IActionResult GetStatistics()
    {
        var allReadings = _healthDataService.GetAllReadings();
        
        // Using LINQ for complex aggregations
        var stats = new
        {
            TotalReadings = allReadings.Count,
            DeviceTypes = allReadings.Select(r => r.DeviceType).Distinct().ToList(),
            AveragesByType = _healthDataService.GetAveragesByType(),
            ReadingsLast24Hours = allReadings
                .Where(r => r.Timestamp >= DateTime.Now.AddHours(-24))
                .Count(),
            MaxValue = allReadings.Any() ? allReadings.Max(r => r.Value) : 0,
            MinValue = allReadings.Any() ? allReadings.Min(r => r.Value) : 0
        };

        return Json(stats);
    }

    [HttpGet]
    public IActionResult ExportJson()
    {
        var readings = _healthDataService.GetAllReadings();
        var json = JsonSerializer.Serialize(readings, new JsonSerializerOptions 
        { 
            WriteIndented = true 
        });
        
        return Content(json, "application/json");
    }

    [HttpGet]
    public IActionResult ExportXml()
    {
        var readings = _healthDataService.GetAllReadings();
        
        // Creating XML using LINQ to XML
        var xml = new XElement("HealthReadings",
            readings.Select(r => new XElement("Reading",
                new XElement("Id", r.Id),
                new XElement("DeviceId", r.DeviceId),
                new XElement("DeviceType", r.DeviceType),
                new XElement("Value", r.Value),
                new XElement("Unit", r.Unit),
                new XElement("Timestamp", r.Timestamp.ToString("o")),
                new XElement("Notes", r.Notes ?? "")
            ))
        );

        return Content(xml.ToString(), "application/xml");
    }

    [HttpPost]
    public IActionResult ImportJson([FromBody] List<HealthReadingDto> readings)
    {
        if (readings != null && readings.Any())
        {
            foreach (var reading in readings)
            {
                _healthDataService.AddReading(reading);
            }
            return Json(new { success = true, message = $"Imported {readings.Count} readings" });
        }
        return Json(new { success = false, message = "No valid readings provided" });
    }

    [HttpGet]
    public IActionResult Analytics()
    {
        var allReadings = _healthDataService.GetAllReadings();
        
        // Advanced LINQ queries for analytics
        var analytics = new
        {
            ReadingsByHour = allReadings
                .GroupBy(r => r.Timestamp.Hour)
                .Select(g => new { Hour = g.Key, Count = g.Count() })
                .OrderBy(x => x.Hour)
                .ToList(),
                
            ReadingsByDevice = _healthDataService.GetReadingsGroupedByDevice()
                .Select(kvp => new { Device = kvp.Key, Count = kvp.Value.Count })
                .OrderByDescending(x => x.Count)
                .ToList(),
                
            RecentTrends = allReadings
                .Where(r => r.Timestamp >= DateTime.Now.AddHours(-24))
                .GroupBy(r => r.DeviceType)
                .Select(g => new 
                { 
                    Type = g.Key, 
                    Average = g.Average(r => r.Value),
                    Count = g.Count(),
                    Latest = g.OrderByDescending(r => r.Timestamp).First().Value
                })
                .ToList()
        };

        return Json(analytics);
    }

    [HttpDelete]
    public IActionResult ClearAllReadings()
    {
        _healthDataService.ClearAllReadings();
        return Json(new { success = true, message = "All readings cleared" });
    }
}
