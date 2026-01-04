// Dashboard JavaScript with jQuery and jQuery Animate
// Handles UI interactions, animations, and AJAX calls

$(document).ready(function() {
    console.log('Dashboard initialized with jQuery');
    
    // Button event handlers
    $('#connectHeartRate').on('click', function() {
        $(this).prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Connecting...');
        
        window.bluetoothDevice.connectHeartRateMonitor().then(() => {
            $(this).prop('disabled', false).html('<i class="fas fa-heart"></i> Connect Heart Rate Monitor');
        }).catch(() => {
            $(this).prop('disabled', false).html('<i class="fas fa-heart"></i> Connect Heart Rate Monitor');
        });
    });
    
    $('#connectThermometer').on('click', function() {
        $(this).prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Connecting...');
        
        window.bluetoothDevice.connectThermometer().then(() => {
            $(this).prop('disabled', false).html('<i class="fas fa-thermometer-half"></i> Connect Thermometer');
        }).catch(() => {
            $(this).prop('disabled', false).html('<i class="fas fa-thermometer-half"></i> Connect Thermometer');
        });
    });
    
    $('#connectESP32').on('click', function() {
        $(this).prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Connecting...');
        
        window.bluetoothDevice.connectESP32Device().then(() => {
            $(this).prop('disabled', false).html('<i class="fas fa-microchip"></i> Connect ESP32 Device');
        }).catch(() => {
            $(this).prop('disabled', false).html('<i class="fas fa-microchip"></i> Connect ESP32 Device');
        });
    });
    
    $('#disconnectAll').on('click', function() {
        window.bluetoothDevice.disconnectAll();
        // Animate the button
        $(this).animate({ 
            opacity: 0.5 
        }, 200, function() {
            $(this).animate({ opacity: 1 }, 200);
        });
    });
    
    // Clear all data
    $('#clearData').on('click', function() {
        if (confirm('Are you sure you want to clear all health data? This cannot be undone.')) {
            $.ajax({
                url: '/Health/ClearAllReadings',
                type: 'DELETE',
                success: function(response) {
                    showNotification('All data cleared successfully', 'success');
                    setTimeout(() => location.reload(), 1000);
                },
                error: function(xhr, status, error) {
                    showNotification('Error clearing data: ' + error, 'danger');
                }
            });
        }
    });
    
    // Load Analytics
    $('#loadAnalytics').on('click', function() {
        loadAnalyticsData();
    });
    
    // Auto-refresh readings every 10 seconds
    setInterval(function() {
        refreshReadingsTable();
    }, 10000);
    
    // Fetch health data from external APIs
    fetchExternalHealthData();
    
    // Initialize tooltips and animations
    initializeAnimations();
});

// Refresh readings table using jQuery AJAX
function refreshReadingsTable() {
    $.ajax({
        url: '/Health/GetReadings',
        type: 'GET',
        success: function(readings) {
            if (readings && readings.length > 0) {
                updateReadingsTable(readings.slice(0, 20));
            }
        },
        error: function(xhr, status, error) {
            console.error('Error fetching readings:', error);
        }
    });
}

// Update readings table with jQuery animation
function updateReadingsTable(readings) {
    const tbody = $('#readingsTable tbody');
    tbody.fadeOut(300, function() {
        tbody.empty();
        
        readings.forEach(function(reading) {
            const timestamp = new Date(reading.timestamp).toLocaleString();
            const row = $('<tr>').addClass('reading-row').hide();
            
            row.append($('<td>').text(timestamp));
            row.append($('<td>').html(`<span class="badge bg-primary">${reading.deviceType}</span>`));
            row.append($('<td>').text(reading.deviceId));
            row.append($('<td>').html(`<strong>${reading.value.toFixed(2)}</strong>`));
            row.append($('<td>').text(reading.unit));
            row.append($('<td>').text(reading.notes || ''));
            
            tbody.append(row);
        });
        
        tbody.fadeIn(300);
        tbody.find('tr').each(function(index) {
            $(this).delay(index * 50).fadeIn(200);
        });
    });
}

// Load analytics data with jQuery
function loadAnalyticsData() {
    $('#analyticsModal').modal('show');
    $('#analyticsContent').html('<div class="text-center"><div class="spinner-border" role="status"></div></div>');
    
    $.ajax({
        url: '/Health/Analytics',
        type: 'GET',
        success: function(data) {
            displayAnalytics(data);
        },
        error: function(xhr, status, error) {
            $('#analyticsContent').html(`<div class="alert alert-danger">Error loading analytics: ${error}</div>`);
        }
    });
}

// Display analytics with jQuery animations
function displayAnalytics(data) {
    let html = '<div class="container-fluid">';
    
    // Readings by Hour
    if (data.readingsByHour && data.readingsByHour.length > 0) {
        html += '<div class="row mb-4"><div class="col-12">';
        html += '<h4><i class="fas fa-clock"></i> Readings by Hour</h4>';
        html += '<div class="chart-container">';
        data.readingsByHour.forEach(function(item) {
            const percentage = (item.count / Math.max(...data.readingsByHour.map(x => x.count))) * 100;
            html += `
                <div class="chart-bar" style="margin-bottom: 10px;">
                    <div class="chart-label">${item.hour}:00</div>
                    <div class="progress" style="height: 30px;">
                        <div class="progress-bar bg-info" role="progressbar" 
                             style="width: ${percentage}%" 
                             aria-valuenow="${item.count}" aria-valuemin="0" aria-valuemax="100">
                            ${item.count}
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div></div></div>';
    }
    
    // Readings by Device
    if (data.readingsByDevice && data.readingsByDevice.length > 0) {
        html += '<div class="row mb-4"><div class="col-12">';
        html += '<h4><i class="fas fa-devices"></i> Readings by Device</h4>';
        html += '<div class="row">';
        data.readingsByDevice.forEach(function(item) {
            html += `
                <div class="col-md-4 mb-3">
                    <div class="card analytics-card">
                        <div class="card-body">
                            <h5>${item.device}</h5>
                            <h3 class="text-primary">${item.count}</h3>
                            <p class="text-muted">readings</p>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div></div></div>';
    }
    
    // Recent Trends
    if (data.recentTrends && data.recentTrends.length > 0) {
        html += '<div class="row mb-4"><div class="col-12">';
        html += '<h4><i class="fas fa-chart-line"></i> 24-Hour Trends</h4>';
        html += '<div class="table-responsive">';
        html += '<table class="table table-striped">';
        html += '<thead><tr><th>Type</th><th>Average</th><th>Count</th><th>Latest</th></tr></thead><tbody>';
        data.recentTrends.forEach(function(trend) {
            html += `
                <tr>
                    <td><span class="badge bg-primary">${trend.type}</span></td>
                    <td><strong>${trend.average.toFixed(2)}</strong></td>
                    <td>${trend.count}</td>
                    <td>${trend.latest.toFixed(2)}</td>
                </tr>
            `;
        });
        html += '</tbody></table></div></div></div>';
    }
    
    html += '</div>';
    
    $('#analyticsContent').html(html);
    $('#analyticsContent').hide().fadeIn(500);
}

// Show notification with jQuery animate
function showNotification(message, type) {
    const notification = $('<div>')
        .addClass(`alert alert-${type} notification`)
        .html(`<i class="fas fa-info-circle"></i> ${message}`)
        .css({
            position: 'fixed',
            top: '80px',
            right: '20px',
            zIndex: 9999,
            minWidth: '300px',
            display: 'none'
        });
    
    $('body').append(notification);
    
    notification.slideDown(300).delay(3000).slideUp(300, function() {
        $(this).remove();
    });
}

// Initialize animations with jQuery animate
function initializeAnimations() {
    // Animate stat cards on load
    $('.stat-card').each(function(index) {
        $(this).css({ opacity: 0, transform: 'translateY(20px)' });
        $(this).delay(index * 100).animate(
            { opacity: 1 },
            {
                duration: 500,
                step: function(now) {
                    $(this).css('transform', `translateY(${20 - (now * 20)}px)`);
                }
            }
        );
    });
    
    // Pulse animation for new readings
    $('.reading-row:first-child').addClass('new-reading');
}

// Fetch external health data APIs
function fetchExternalHealthData() {
    // Example: Fetch health tips from a public API
    fetchHealthTips();
    fetchCovidData();
    fetchAirQualityData();
}

// Fetch health tips from API
function fetchHealthTips() {
    // Using a free health API (example)
    $.ajax({
        url: 'https://api.api-ninjas.com/v1/quotes?category=health',
        type: 'GET',
        headers: { 'X-Api-Key': 'demo' }, // In production, use proper API key
        success: function(data) {
            if (data && data.length > 0) {
                displayHealthTip(data[0]);
            }
        },
        error: function() {
            console.log('Could not fetch health tips');
        }
    });
}

// Display health tip with animation
function displayHealthTip(tip) {
    const tipCard = $('<div>')
        .addClass('alert alert-info health-tip')
        .html(`<i class="fas fa-lightbulb"></i> <strong>Health Tip:</strong> ${tip.quote}`)
        .css({ display: 'none' });
    
    $('.container-fluid').prepend(tipCard);
    tipCard.slideDown(500);
}

// Fetch COVID-19 data from API
function fetchCovidData() {
    $.ajax({
        url: 'https://disease.sh/v3/covid-19/all',
        type: 'GET',
        success: function(data) {
            console.log('COVID-19 Global Data:', data);
            displayCovidWidget(data);
        },
        error: function() {
            console.log('Could not fetch COVID-19 data');
        }
    });
}

// Display COVID widget
function displayCovidWidget(data) {
    const widget = $(`
        <div class="covid-widget card shadow mb-4" style="display: none;">
            <div class="card-header bg-warning text-dark">
                <h5><i class="fas fa-virus"></i> Global COVID-19 Stats</h5>
            </div>
            <div class="card-body">
                <div class="row text-center">
                    <div class="col-md-4">
                        <h6>Total Cases</h6>
                        <h4 class="text-primary">${(data.cases / 1000000).toFixed(1)}M</h4>
                    </div>
                    <div class="col-md-4">
                        <h6>Recovered</h6>
                        <h4 class="text-success">${(data.recovered / 1000000).toFixed(1)}M</h4>
                    </div>
                    <div class="col-md-4">
                        <h6>Active</h6>
                        <h4 class="text-warning">${(data.active / 1000000).toFixed(1)}M</h4>
                    </div>
                </div>
            </div>
        </div>
    `);
    
    $('.container-fluid').prepend(widget);
    widget.slideDown(500);
}

// Fetch air quality data
function fetchAirQualityData() {
    // Using OpenAQ API for air quality (public data)
    $.ajax({
        url: 'https://api.openaq.org/v2/latest?limit=1&country=US',
        type: 'GET',
        success: function(data) {
            if (data && data.results && data.results.length > 0) {
                console.log('Air Quality Data:', data.results[0]);
            }
        },
        error: function() {
            console.log('Could not fetch air quality data');
        }
    });
}

// Export function for use by web-bluetooth.js
window.refreshReadingsTable = refreshReadingsTable;
