/**
 * Apple Watch HealthKit Data Fetcher
 * Fetches data from /api/health/latest and updates the dashboard UI
 */
(function ($) {
    'use strict';

    // Configuration
    var REFRESH_INTERVAL = 5000; // 5 seconds
    var API_ENDPOINT = '/api/health/latest';

    // State
    var isRefreshing = false;
    var refreshTimer = null;

    /**
     * Fetch the latest Apple Watch data from the API
     */
    function fetchWatchData() {
        if (isRefreshing) return;
        isRefreshing = true;

        // Show loading state on button
        var $refreshBtn = $('#refreshWatchData');
        var originalHtml = $refreshBtn.html();
        $refreshBtn.html('<i class="fas fa-spinner fa-spin"></i> Loading...').prop('disabled', true);

        $.ajax({
            url: API_ENDPOINT,
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                updateUI(data);
            },
            error: function (xhr, status, error) {
                console.error('Error fetching Apple Watch data:', error);
                // Show error state but don't break the UI
                showNoData();
            },
            complete: function () {
                isRefreshing = false;
                $refreshBtn.html(originalHtml).prop('disabled', false);
            }
        });
    }

    /**
     * Update the UI with the fetched data
     */
    function updateUI(data) {
        if (!data) {
            showNoData();
            return;
        }

        // Update Heart Rate
        if (data.heartRateBpm !== null && data.heartRateBpm !== undefined) {
            $('#watchHeartRateValue').text(Math.round(data.heartRateBpm));
            $('#watchHeartRateCard').removeClass('no-data');
        } else {
            $('#watchHeartRateValue').text('--');
            $('#watchHeartRateCard').addClass('no-data');
        }

        // Update Temperature
        if (data.hasTemperature && data.temperatureC !== null && data.temperatureC !== undefined) {
            $('#watchTempValue').text(data.temperatureC.toFixed(1));
            $('#watchTempCard').removeClass('no-data');
        } else {
            $('#watchTempValue').text('N/A');
            $('#watchTempCard').addClass('no-data');
        }

        // Update Last Sync Time
        if (data.lastSyncUtc) {
            var syncTime = new Date(data.lastSyncUtc);
            var timeStr = syncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            var dateStr = syncTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
            $('#watchLastSync').text(timeStr);
            $('#watchSyncCard').attr('title', 'Last synced: ' + dateStr + ' ' + timeStr);
        } else {
            $('#watchLastSync').text('Never');
        }
    }

    /**
     * Show "no data" state when no Apple Watch data is available
     */
    function showNoData() {
        $('#watchHeartRateValue').text('--');
        $('#watchTempValue').text('--');
        $('#watchLastSync').text('--');
    }

    /**
     * Start auto-refresh timer
     */
    function startAutoRefresh() {
        if (refreshTimer) {
            clearInterval(refreshTimer);
        }
        refreshTimer = setInterval(fetchWatchData, REFRESH_INTERVAL);
    }

    /**
     * Stop auto-refresh timer
     */
    function stopAutoRefresh() {
        if (refreshTimer) {
            clearInterval(refreshTimer);
            refreshTimer = null;
        }
    }

    /**
     * Initialize the Apple Watch data module
     */
    function init() {
        // Bind refresh button click
        $('#refreshWatchData').on('click', function (e) {
            e.preventDefault();
            fetchWatchData();
        });

        // Initial fetch
        fetchWatchData();

        // Start auto-refresh
        startAutoRefresh();

        // Pause auto-refresh when page is hidden (to save resources)
        $(document).on('visibilitychange', function () {
            if (document.hidden) {
                stopAutoRefresh();
            } else {
                fetchWatchData(); // Immediate refresh when page becomes visible
                startAutoRefresh();
            }
        });

        console.log('Apple Watch data module initialized');
    }

    // Initialize when document is ready
    $(document).ready(init);

})(jQuery);
