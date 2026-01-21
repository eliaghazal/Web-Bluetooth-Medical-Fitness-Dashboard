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

    // ===== BMI Calculator =====
    // Tries PHP first (if XAMPP running), falls back to JavaScript calculation

    $('#calculateBmi').on('click', function () {
        var weight = parseFloat($('#weight').val());
        var height = parseFloat($('#height').val());
        var heightUnit = $('#heightUnit').val();

        // Convert height to meters if entered in cm
        if (heightUnit === 'cm') {
            height = height / 100;
        }

        // Validate inputs
        if (!weight || !height || weight <= 0 || height <= 0) {
            $('#bmiResult').html(
                '<div class="alert alert-danger">' +
                '<i class="fas fa-exclamation-triangle me-2"></i>' +
                'Please enter valid Weight and Height values.' +
                '</div>'
            );
            return;
        }

        // Show loading
        $('#bmiResult').html(
            '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Calculating...</div>'
        );

        // Try PHP first (requires XAMPP running on localhost:80)
        $.ajax({
            url: 'http://localhost/health-processor.php',
            type: 'POST',
            data: { weight: weight, height: height },
            dataType: 'json',
            timeout: 2000,  // 2 second timeout
            success: function (response) {
                // PHP calculation succeeded
                displayBmiResult(response.bmi, response.classification, 'PHP (XAMPP)');
            },
            error: function () {
                // PHP not available, calculate with JavaScript
                console.log('PHP not available, using JavaScript calculation');
                var bmi = calculateBmiJs(weight, height);
                var classification = classifyBmi(bmi);
                displayBmiResult(bmi, classification, 'JavaScript');
            }
        });
    });

    // JavaScript BMI calculation (fallback)
    function calculateBmiJs(weight, height) {
        // BMI = weight (kg) / height^2 (m)
        return weight / (height * height);
    }

    // Classify BMI
    function classifyBmi(bmi) {
        if (bmi < 18.5) return 'Underweight';
        if (bmi < 25) return 'Normal weight';
        if (bmi < 30) return 'Overweight';
        return 'Obese';
    }

    // Display BMI result
    function displayBmiResult(bmi, classification, source) {
        var badgeClass = 'bg-success';
        if (classification === 'Underweight') badgeClass = 'bg-warning';
        else if (classification === 'Overweight') badgeClass = 'bg-warning';
        else if (classification === 'Obese') badgeClass = 'bg-danger';

        var roundedBmi = Math.round(bmi * 100) / 100;

        $('#bmiResult').html(
            '<div class="alert alert-success">' +
            '<h4><i class="fas fa-check-circle me-2"></i>Your BMI: <strong>' + roundedBmi + '</strong></h4>' +
            '<p class="mb-2">Classification: <span class="badge ' + badgeClass + ' fs-6">' + classification + '</span></p>' +
            '<small class="text-muted">Calculated via ' + source + '</small>' +
            '</div>'
        );
    }

    // Add Enter key support
    $('#weight, #height').on('keypress', function (e) {
        if (e.which === 13) {
            $('#calculateBmi').click();
        }
    });
});
