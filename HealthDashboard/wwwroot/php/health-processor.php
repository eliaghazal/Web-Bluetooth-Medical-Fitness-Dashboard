<?php
/**
 * Health Data Processor - PHP Script
 * Processes health readings and provides additional data analysis
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Function to calculate BMI
function calculateBMI($weight, $height)
{
    if ($height <= 0)
        return 0;
    return $weight / ($height * $height);
}

// Function to classify heart rate
function classifyHeartRate($heartRate, $age = 30)
{
    $maxHR = 220 - $age;
    $percentage = ($heartRate / $maxHR) * 100;

    if ($percentage < 50)
        return "Resting";
    if ($percentage < 60)
        return "Very Light";
    if ($percentage < 70)
        return "Light";
    if ($percentage < 80)
        return "Moderate";
    if ($percentage < 90)
        return "Hard";
    return "Maximum";
}

// Function to classify body temperature
function classifyTemperature($temp)
{
    if ($temp < 36.1)
        return "Low (Hypothermia risk)";
    if ($temp >= 36.1 && $temp <= 37.2)
        return "Normal";
    if ($temp > 37.2 && $temp < 38.0)
        return "Slightly Elevated";
    if ($temp >= 38.0 && $temp < 39.0)
        return "Fever";
    return "High Fever";
}

// Function to analyze health data
function analyzeHealthData($readings)
{
    $analysis = [
        'total_readings' => count($readings),
        'average_value' => 0,
        'min_value' => PHP_INT_MAX,
        'max_value' => PHP_INT_MIN,
        'device_types' => [],
        'recommendations' => []
    ];

    $sum = 0;
    foreach ($readings as $reading) {
        $value = $reading['value'];
        $sum += $value;

        if ($value < $analysis['min_value']) {
            $analysis['min_value'] = $value;
        }
        if ($value > $analysis['max_value']) {
            $analysis['max_value'] = $value;
        }

        $deviceType = $reading['deviceType'];
        if (!isset($analysis['device_types'][$deviceType])) {
            $analysis['device_types'][$deviceType] = 0;
        }
        $analysis['device_types'][$deviceType]++;

        // Add recommendations based on device type
        if ($deviceType === 'heart_rate') {
            $classification = classifyHeartRate($value);
            $analysis['recommendations'][] = "Heart Rate: {$value} BPM - {$classification}";
        } elseif ($deviceType === 'thermometer') {
            $classification = classifyTemperature($value);
            $analysis['recommendations'][] = "Temperature: {$value}°C - {$classification}";
        }
    }

    if (count($readings) > 0) {
        $analysis['average_value'] = $sum / count($readings);
    }

    return $analysis;
}

// Handle GET request
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Sample health data for demonstration
    $sampleData = [
        [
            'id' => 1,
            'deviceType' => 'heart_rate',
            'value' => 72,
            'unit' => 'BPM',
            'timestamp' => date('Y-m-d H:i:s')
        ],
        [
            'id' => 2,
            'deviceType' => 'thermometer',
            'value' => 36.8,
            'unit' => '°C',
            'timestamp' => date('Y-m-d H:i:s')
        ],
        [
            'id' => 3,
            'deviceType' => 'esp32',
            'value' => 75.5,
            'unit' => 'units',
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ];

    $analysis = analyzeHealthData($sampleData);

    $response = [
        'status' => 'success',
        'message' => 'Health data processed successfully',
        'data' => $sampleData,
        'analysis' => $analysis,
        'processed_at' => date('Y-m-d H:i:s'),
        'php_version' => phpversion()
    ];

    echo json_encode($response, JSON_PRETTY_PRINT);
}

// Handle POST request
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // ===== BMI Calculation via $_POST (Syllabus: Working with Forms) =====
    // This endpoint receives Weight and Height from a jQuery AJAX form
    if (isset($_POST['weight']) && isset($_POST['height'])) {
        $weight = floatval($_POST['weight']); // Weight in kg
        $height = floatval($_POST['height']); // Height in meters

        // Calculate BMI using the function defined above
        $bmi = calculateBMI($weight, $height);

        // Classify BMI
        $classification = '';
        if ($bmi < 18.5)
            $classification = 'Underweight';
        elseif ($bmi < 25)
            $classification = 'Normal weight';
        elseif ($bmi < 30)
            $classification = 'Overweight';
        else
            $classification = 'Obese';

        // Return JSON response
        echo json_encode([
            'status' => 'success',
            'bmi' => round($bmi, 2),
            'classification' => $classification,
            'weight' => $weight,
            'height' => $height,
            'processed_at' => date('Y-m-d H:i:s')
        ], JSON_PRETTY_PRINT);
        exit;
    }

    // Handle JSON body for health readings analysis
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if ($data && isset($data['readings'])) {
        $analysis = analyzeHealthData($data['readings']);

        $response = [
            'status' => 'success',
            'message' => 'Data analyzed successfully',
            'analysis' => $analysis,
            'processed_at' => date('Y-m-d H:i:s')
        ];

        echo json_encode($response, JSON_PRETTY_PRINT);
    } else {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid input data'
        ]);
    }
}

// Calculate BMI example
if (isset($_GET['calculate_bmi'])) {
    $weight = isset($_GET['weight']) ? floatval($_GET['weight']) : 70;
    $height = isset($_GET['height']) ? floatval($_GET['height']) : 1.75;

    $bmi = calculateBMI($weight, $height);

    $classification = '';
    if ($bmi < 18.5)
        $classification = 'Underweight';
    elseif ($bmi < 25)
        $classification = 'Normal weight';
    elseif ($bmi < 30)
        $classification = 'Overweight';
    else
        $classification = 'Obese';

    echo json_encode([
        'status' => 'success',
        'bmi' => round($bmi, 2),
        'classification' => $classification,
        'weight' => $weight,
        'height' => $height
    ], JSON_PRETTY_PRINT);
}
?>