// Health Data Page JavaScript
// Uses jQuery selectors and events as required by syllabus

$(document).ready(function () {
    console.log('Health Data page initialized with jQuery');

    // Initialize DataTable if available
    if ($.fn.DataTable) {
        $('#allReadingsTable').DataTable({
            order: [[1, 'desc']],
            pageLength: 25
        });
    }

    // ===== BMI Calculator - jQuery AJAX to PHP (Syllabus Requirement) =====
    // This sends Weight/Height to health-processor.php using $.post()

    $('#calculateBmi').on('click', function () {
        // Get input values using jQuery selectors
        var weight = $('#weight').val();
        var height = $('#height').val();

        // Validate inputs
        if (!weight || !height || weight <= 0 || height <= 0) {
            $('#bmiResult').html(
                '<div class="alert alert-danger">' +
                '<i class="fas fa-exclamation-triangle"></i> Please enter valid Weight and Height values.' +
                '</div>'
            );
            return;
        }

        // Show loading state
        $('#bmiResult').html(
            '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Calculating...</div>'
        );

        // ===== jQuery AJAX POST to PHP (Syllabus: Working with Forms/JSON) =====
        // Using $.post() to send data to PHP file
        // PHP receives data via $_POST['weight'] and $_POST['height']
        $.ajax({
            url: '/php/health-processor.php',  // PHP file in wwwroot
            type: 'POST',
            data: {
                weight: weight,  // Sent as $_POST['weight'] in PHP
                height: height   // Sent as $_POST['height'] in PHP
            },
            dataType: 'json',
            success: function (response) {
                // PHP returns JSON with BMI and classification
                if (response.status === 'success') {
                    var badgeClass = 'bg-success';
                    if (response.classification === 'Underweight') badgeClass = 'bg-warning';
                    else if (response.classification === 'Overweight') badgeClass = 'bg-warning';
                    else if (response.classification === 'Obese') badgeClass = 'bg-danger';

                    $('#bmiResult').html(
                        '<div class="alert alert-success">' +
                        '<h4><i class="fas fa-check-circle"></i> Your BMI: <strong>' + response.bmi + '</strong></h4>' +
                        '<p>Classification: <span class="badge ' + badgeClass + '">' + response.classification + '</span></p>' +
                        '<small class="text-muted">Calculated by PHP at ' + response.processed_at + '</small>' +
                        '</div>'
                    );
                } else {
                    $('#bmiResult').html(
                        '<div class="alert alert-danger">' +
                        '<i class="fas fa-times-circle"></i> Error from PHP: ' + response.message +
                        '</div>'
                    );
                }
            },
            error: function (xhr, status, error) {
                // Handle AJAX error
                $('#bmiResult').html(
                    '<div class="alert alert-warning">' +
                    '<i class="fas fa-info-circle"></i> <strong>Note:</strong> PHP server is not running.<br>' +
                    '<small>To use PHP integration, run XAMPP/WAMP and access via localhost.</small>' +
                    '</div>'
                );
                console.log('AJAX Error:', error);
            }
        });
    });

    // Add Enter key support for the form
    $('#weight, #height').on('keypress', function (e) {
        if (e.which === 13) {  // Enter key
            $('#calculateBmi').click();
        }
    });
});
