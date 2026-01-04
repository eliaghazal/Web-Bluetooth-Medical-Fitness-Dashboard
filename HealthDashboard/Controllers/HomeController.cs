using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using HealthDashboard.Models;
using HealthDashboard.Services;

namespace HealthDashboard.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;
    private readonly HealthDataService _healthDataService;

    public HomeController(ILogger<HomeController> logger, HealthDataService healthDataService)
    {
        _logger = logger;
        _healthDataService = healthDataService;
    }

    public IActionResult Index()
    {
        var dashboardData = _healthDataService.GetDashboardData();
        return View(dashboardData);
    }

    public IActionResult Privacy()
    {
        return View();
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
