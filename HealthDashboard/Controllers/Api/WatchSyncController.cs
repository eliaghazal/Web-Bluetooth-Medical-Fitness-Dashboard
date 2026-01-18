using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using HealthDashboard.Models;
using HealthDashboard.Services;

namespace HealthDashboard.Controllers.Api;

/// <summary>
/// API Controller for Apple Watch HealthKit data sync
/// </summary>
[ApiController]
[Route("api/health")]
public class WatchSyncController : ControllerBase
{
    private readonly HealthDataService _healthDataService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<WatchSyncController> _logger;

    public WatchSyncController(
        HealthDataService healthDataService, 
        UserManager<ApplicationUser> userManager,
        ILogger<WatchSyncController> logger)
    {
        _healthDataService = healthDataService;
        _userManager = userManager;
        _logger = logger;
    }

    /// <summary>
    /// Receive health data from iOS app (Apple Watch via HealthKit)
    /// POST /api/health/watch-sync
    /// </summary>
    [HttpPost("watch-sync")]
    [Authorize]
    public IActionResult WatchSync([FromBody] WatchSyncPayload payload)
    {
        try
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new WatchSyncResponse 
                { 
                    Success = false, 
                    Message = "User not authenticated" 
                });
            }

            if (payload == null)
            {
                return BadRequest(new WatchSyncResponse 
                { 
                    Success = false, 
                    Message = "Invalid payload" 
                });
            }

            // Validate that we have at least some data
            if (!payload.HeartRateBpm.HasValue && !payload.TemperatureC.HasValue)
            {
                return BadRequest(new WatchSyncResponse 
                { 
                    Success = false, 
                    Message = "No health data provided" 
                });
            }

            // Save the data
            _healthDataService.SaveWatchData(userId, payload);

            _logger.LogInformation(
                "Apple Watch sync for user {UserId}: HR={HeartRate}, Temp={Temp}", 
                userId, 
                payload.HeartRateBpm, 
                payload.TemperatureC);

            return Ok(new WatchSyncResponse 
            { 
                Success = true, 
                Message = "Data synced successfully" 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing Apple Watch data");
            return StatusCode(500, new WatchSyncResponse 
            { 
                Success = false, 
                Message = "Server error" 
            });
        }
    }

    /// <summary>
    /// Get the latest Apple Watch data for the current user
    /// GET /api/health/latest
    /// </summary>
    [HttpGet("latest")]
    [Authorize]
    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult GetLatest()
    {
        var userId = _userManager.GetUserId(User);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var data = _healthDataService.GetLatestWatchData(userId);
        
        if (data == null)
        {
            // Return empty data structure (not an error - just no data yet)
            return Ok(new WatchLatestData
            {
                HeartRateBpm = null,
                TemperatureC = null,
                HasTemperature = false,
                Source = "",
                LastSyncUtc = null
            });
        }

        return Ok(data);
    }

    /// <summary>
    /// Alternative sync endpoint that accepts API key instead of session auth
    /// Useful for iOS app when user is not logged in via browser session
    /// POST /api/health/watch-sync-key
    /// </summary>
    [HttpPost("watch-sync-key")]
    [AllowAnonymous]
    public async Task<IActionResult> WatchSyncWithKey([FromBody] WatchSyncPayload payload)
    {
        try
        {
            if (payload == null || string.IsNullOrEmpty(payload.ApiKey))
            {
                return BadRequest(new WatchSyncResponse 
                { 
                    Success = false, 
                    Message = "API key required" 
                });
            }

            // Find user by API key (using email as simple API key for now)
            var user = await _userManager.FindByEmailAsync(payload.ApiKey);
            if (user == null)
            {
                return Unauthorized(new WatchSyncResponse 
                { 
                    Success = false, 
                    Message = "Invalid API key" 
                });
            }

            // Validate that we have at least some data
            if (!payload.HeartRateBpm.HasValue && !payload.TemperatureC.HasValue)
            {
                return BadRequest(new WatchSyncResponse 
                { 
                    Success = false, 
                    Message = "No health data provided" 
                });
            }

            // Save the data
            _healthDataService.SaveWatchData(user.Id, payload);

            _logger.LogInformation(
                "Apple Watch sync via API key for user {UserId}: HR={HeartRate}, Temp={Temp}", 
                user.Id, 
                payload.HeartRateBpm, 
                payload.TemperatureC);

            return Ok(new WatchSyncResponse 
            { 
                Success = true, 
                Message = "Data synced successfully" 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing Apple Watch data via API key");
            return StatusCode(500, new WatchSyncResponse 
            { 
                Success = false, 
                Message = "Server error" 
            });
        }
    }
}
