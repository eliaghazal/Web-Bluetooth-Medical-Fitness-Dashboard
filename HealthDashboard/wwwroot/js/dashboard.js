// Dashboard JavaScript with jQuery and jQuery Animate
// Demonstrates: jQuery DOM manipulation, AJAX calls, JSON handling

$(document).ready(function () {
    console.log('Dashboard initialized with jQuery');

    // =====================================================
    // BLUETOOTH DEVICE BUTTON HANDLERS
    // Uses jQuery event handling and DOM manipulation
    // =====================================================
    
    $('#connectHeartRate').on('click', function () {
        $(this).prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Connecting...');
        window.bluetoothDevice.connectHeartRateMonitor().then(() => {
            $(this).prop('disabled', false).html('<i class="fas fa-heart"></i> Connect Heart Rate Monitor');
        }).catch(() => {
            $(this).prop('disabled', false).html('<i class="fas fa-heart"></i> Connect Heart Rate Monitor');
        });
    });

    $('#connectThermometer').on('click', function () {
        $(this).prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Connecting...');
        window.bluetoothDevice.connectThermometer().then(() => {
            $(this).prop('disabled', false).html('<i class="fas fa-thermometer-half"></i> Connect Thermometer');
        }).catch(() => {
            $(this).prop('disabled', false).html('<i class="fas fa-thermometer-half"></i> Connect Thermometer');
        });
    });

    $('#connectESP32').on('click', function () {
        $(this).prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Connecting...');
        window.bluetoothDevice.connectESP32Device().then(() => {
            $(this).prop('disabled', false).html('<i class="fas fa-microchip"></i> Connect ESP32 Device');
        }).catch(() => {
            $(this).prop('disabled', false).html('<i class="fas fa-microchip"></i> Connect ESP32 Device');
        });
    });

    $('#disconnectAll').on('click', function () {
        window.bluetoothDevice.disconnectAll();
        // jQuery animate for button feedback
        $(this).animate({ opacity: 0.5 }, 200, function () {
            $(this).animate({ opacity: 1 }, 200);
        });
    });

    // =====================================================
    // DATA MANAGEMENT BUTTONS
    // =====================================================
    
    $('#clearData').on('click', function () {
        if (confirm('Are you sure you want to clear all health data?')) {
            // jQuery AJAX call to delete data
            $.ajax({
                url: '/Health/ClearAllReadings',
                type: 'DELETE',
                success: function (response) {
                    showNotification('All data cleared successfully', 'success');
                    setTimeout(() => location.reload(), 1000);
                },
                error: function (xhr, status, error) {
                    showNotification('Error clearing data: ' + error, 'danger');
                }
            });
        }
    });

    $('#loadAnalytics').on('click', function () {
        loadAnalyticsData();
    });

    // Auto-refresh readings table every 10 seconds
    setInterval(refreshReadingsTable, 10000);

    // Fetch COVID-19 data from external API
    fetchCovidData();

    // Initialize animations
    initializeAnimations();
});

// =====================================================
// REFRESH READINGS TABLE
// Uses jQuery AJAX to fetch JSON data from server
// =====================================================

function refreshReadingsTable() {
    $.ajax({
        url: '/Health/GetReadings',
        type: 'GET',
        dataType: 'json',
        success: function (readings) {
            if (readings && readings.length > 0) {
                updateReadingsTable(readings.slice(0, 20));
            }
        },
        error: function (xhr, status, error) {
            console.error('Error fetching readings:', error);
        }
    });
}

// Helper function to escape HTML to prevent XSS
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Update table with jQuery animations
function updateReadingsTable(readings) {
    var tbody = $('#readingsTable tbody');
    tbody.fadeOut(300, function () {
        tbody.empty();

        readings.forEach(function (reading) {
            var timestamp = new Date(reading.timestamp).toLocaleString();
            var row = $('<tr>').addClass('reading-row').hide();

            row.append($('<td>').text(timestamp));
            row.append($('<td>').append($('<span>').addClass('badge bg-primary').text(reading.deviceType)));
            row.append($('<td>').text(reading.deviceId));
            row.append($('<td>').append($('<strong>').text(reading.value.toFixed(2))));
            row.append($('<td>').text(reading.unit));
            row.append($('<td>').text(reading.notes || ''));

            tbody.append(row);
        });

        tbody.fadeIn(300);
        tbody.find('tr').each(function (index) {
            $(this).delay(index * 50).fadeIn(200);
        });
    });
}

// =====================================================
// ANALYTICS MODAL
// Uses jQuery AJAX and DOM manipulation
// =====================================================

function loadAnalyticsData() {
    $('#analyticsModal').modal('show');
    $('#analyticsContent').html('<div class="text-center"><div class="spinner-border" role="status"></div></div>');

    $.ajax({
        url: '/Health/Analytics',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            displayAnalytics(data);
        },
        error: function (xhr, status, error) {
            $('#analyticsContent').empty().append(
                $('<div>').addClass('alert alert-danger').text('Error loading analytics')
            );
        }
    });
}

function displayAnalytics(data) {
    var container = $('<div>').addClass('container-fluid');

    // Readings by Hour
    if (data.readingsByHour && data.readingsByHour.length > 0) {
        var hourSection = $('<div>').addClass('row mb-4').append(
            $('<div>').addClass('col-12').append(
                $('<h4>').html('<i class="fas fa-clock"></i> Readings by Hour'),
                $('<div>').addClass('chart-container')
            )
        );
        
        // Use reduce to find max count (safer than Math.max.apply for large arrays)
        var maxCount = data.readingsByHour.reduce(function(max, x) {
            return x.count > max ? x.count : max;
        }, 0);
        
        var chartContainer = hourSection.find('.chart-container');
        data.readingsByHour.forEach(function (item) {
            var percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            chartContainer.append(
                $('<div>').addClass('chart-bar').css('margin-bottom', '10px').append(
                    $('<div>').addClass('chart-label').text(item.hour + ':00'),
                    $('<div>').addClass('progress').css('height', '30px').append(
                        $('<div>').addClass('progress-bar bg-info').css('width', percentage + '%').text(item.count)
                    )
                )
            );
        });
        container.append(hourSection);
    }

    // Readings by Device
    if (data.readingsByDevice && data.readingsByDevice.length > 0) {
        var deviceSection = $('<div>').addClass('row mb-4').append(
            $('<div>').addClass('col-12').append(
                $('<h4>').html('<i class="fas fa-microchip"></i> Readings by Device'),
                $('<div>').addClass('row')
            )
        );
        
        var deviceRow = deviceSection.find('.row').last();
        data.readingsByDevice.forEach(function (item) {
            deviceRow.append(
                $('<div>').addClass('col-md-4 mb-3').append(
                    $('<div>').addClass('card analytics-card').append(
                        $('<div>').addClass('card-body').append(
                            $('<h5>').text(item.device),
                            $('<h3>').addClass('text-primary').text(item.count),
                            $('<p>').addClass('text-muted').text('readings')
                        )
                    )
                )
            );
        });
        container.append(deviceSection);
    }

    $('#analyticsContent').empty().append(container);
    $('#analyticsContent').hide().fadeIn(500);
}

// =====================================================
// NOTIFICATIONS
// Uses jQuery for DOM manipulation and animation
// =====================================================

function showNotification(message, type) {
    var notification = $('<div>')
        .addClass('alert alert-' + escapeHtml(type) + ' notification')
        .css({
            position: 'fixed',
            top: '80px',
            right: '20px',
            zIndex: 9999,
            minWidth: '300px',
            display: 'none'
        });
    
    notification.append($('<i>').addClass('fas fa-info-circle'));
    notification.append(' ');
    notification.append($('<span>').text(message));

    $('body').append(notification);
    notification.slideDown(300).delay(3000).slideUp(300, function () {
        $(this).remove();
    });
}

// =====================================================
// ANIMATIONS
// Uses jQuery animate for visual effects
// =====================================================

function initializeAnimations() {
    // Animate stat cards on page load
    $('.stat-card').each(function (index) {
        $(this).css({ opacity: 0, transform: 'translateY(20px)' });
        $(this).delay(index * 100).animate(
            { opacity: 1 },
            {
                duration: 500,
                step: function (now) {
                    $(this).css('transform', 'translateY(' + (20 - (now * 20)) + 'px)');
                }
            }
        );
    });
}

// =====================================================
// COVID-19 DATA (External API)
// Demonstrates fetching JSON from external API
// =====================================================

function fetchCovidData() {
    $.ajax({
        url: 'https://disease.sh/v3/covid-19/all',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            console.log('COVID-19 Global Data:', data);
            displayCovidWidget(data);
        },
        error: function () {
            console.log('Could not fetch COVID-19 data');
        }
    });
}

function displayCovidWidget(data) {
    var widget = $('<div class="covid-widget card shadow mb-4" style="display: none;">' +
        '<div class="card-header bg-warning text-dark">' +
        '<h5><i class="fas fa-virus"></i> Global COVID-19 Stats (External API)</h5>' +
        '</div>' +
        '<div class="card-body">' +
        '<div class="row text-center">' +
        '<div class="col-md-4">' +
        '<h6>Total Cases</h6>' +
        '<h4 class="text-primary">' + (data.cases / 1000000).toFixed(1) + 'M</h4>' +
        '</div>' +
        '<div class="col-md-4">' +
        '<h6>Recovered</h6>' +
        '<h4 class="text-success">' + (data.recovered / 1000000).toFixed(1) + 'M</h4>' +
        '</div>' +
        '<div class="col-md-4">' +
        '<h6>Active</h6>' +
        '<h4 class="text-warning">' + (data.active / 1000000).toFixed(1) + 'M</h4>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>');

    $('.container-fluid').prepend(widget);
    widget.slideDown(500);
}

// Export for use by web-bluetooth.js
window.refreshReadingsTable = refreshReadingsTable;
