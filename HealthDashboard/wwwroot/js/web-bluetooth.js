// Web Bluetooth API Implementation for Medical/Fitness Devices

class BluetoothHealthDevice {
    constructor() {
        this.devices = new Map();
        this.isBluetoothAvailable = 'bluetooth' in navigator;
    }

    // Heart Rate Monitor (Standard Bluetooth Service)
    async connectHeartRateMonitor() {
        if (!this.isBluetoothAvailable) {
            alert('Web Bluetooth API is not available in this browser. Please use Chrome, Edge, or Opera.');
            return null;
        }

        try {
            console.log('Requesting Heart Rate Monitor...');
            
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['heart_rate'] }],
                optionalServices: ['battery_service']
            });

            console.log('Connecting to GATT Server...');
            const server = await device.gatt.connect();
            
            console.log('Getting Heart Rate Service...');
            const service = await server.getPrimaryService('heart_rate');
            
            console.log('Getting Heart Rate Measurement Characteristic...');
            const characteristic = await service.getCharacteristic('heart_rate_measurement');
            
            // Start notifications
            await characteristic.startNotifications();
            characteristic.addEventListener('characteristicvaluechanged', (event) => {
                const value = this.parseHeartRate(event.target.value);
                this.handleHeartRateData(device.id, device.name, value);
            });

            this.devices.set(device.id, { device, server, type: 'heart_rate' });
            this.updateConnectionStatus(`Connected to ${device.name || 'Heart Rate Monitor'}`, 'success');
            
            return device;
        } catch (error) {
            console.error('Heart Rate Monitor connection error:', error);
            this.updateConnectionStatus(`Failed to connect: ${error.message}`, 'danger');
            return null;
        }
    }

    // Thermometer (Health Thermometer Service)
    async connectThermometer() {
        if (!this.isBluetoothAvailable) {
            alert('Web Bluetooth API is not available in this browser.');
            return null;
        }

        try {
            console.log('Requesting Thermometer...');
            
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['health_thermometer'] }],
                optionalServices: ['battery_service']
            });

            console.log('Connecting to GATT Server...');
            const server = await device.gatt.connect();
            
            console.log('Getting Thermometer Service...');
            const service = await server.getPrimaryService('health_thermometer');
            
            console.log('Getting Temperature Measurement Characteristic...');
            const characteristic = await service.getCharacteristic('temperature_measurement');
            
            // Start notifications
            await characteristic.startNotifications();
            characteristic.addEventListener('characteristicvaluechanged', (event) => {
                const value = this.parseTemperature(event.target.value);
                this.handleTemperatureData(device.id, device.name, value);
            });

            this.devices.set(device.id, { device, server, type: 'thermometer' });
            this.updateConnectionStatus(`Connected to ${device.name || 'Thermometer'}`, 'success');
            
            return device;
        } catch (error) {
            console.error('Thermometer connection error:', error);
            this.updateConnectionStatus(`Failed to connect: ${error.message}`, 'danger');
            return null;
        }
    }

    // ESP32 or Generic Device
    async connectESP32Device() {
        if (!this.isBluetoothAvailable) {
            alert('Web Bluetooth API is not available in this browser.');
            return null;
        }

        try {
            console.log('Requesting ESP32 Device...');
            
            // For ESP32, we'll use a generic approach
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['battery_service', 'device_information']
            });

            console.log('Connecting to GATT Server...');
            const server = await device.gatt.connect();
            
            this.devices.set(device.id, { device, server, type: 'esp32' });
            this.updateConnectionStatus(`Connected to ${device.name || 'ESP32 Device'}`, 'success');
            
            // For ESP32, we'll simulate data since the actual service UUID would be custom
            this.startESP32Simulation(device.id, device.name);
            
            return device;
        } catch (error) {
            console.error('ESP32 connection error:', error);
            this.updateConnectionStatus(`Failed to connect: ${error.message}`, 'danger');
            return null;
        }
    }

    // Parse Heart Rate data (according to Bluetooth spec)
    parseHeartRate(value) {
        const flags = value.getUint8(0);
        const rate16Bits = flags & 0x1;
        let heartRate;
        
        if (rate16Bits) {
            heartRate = value.getUint16(1, true);
        } else {
            heartRate = value.getUint8(1);
        }
        
        return heartRate;
    }

    // Parse Temperature data (according to Bluetooth spec)
    parseTemperature(value) {
        const flags = value.getUint8(0);
        const tempValue = value.getFloat32(1, true);
        
        // Convert to Celsius if in Fahrenheit
        if (flags & 0x1) {
            return (tempValue - 32) * 5 / 9;
        }
        
        return tempValue;
    }

    // Handle Heart Rate data
    handleHeartRateData(deviceId, deviceName, value) {
        console.log(`Heart Rate: ${value} BPM`);
        
        // Update UI with jQuery animation
        $('#heartRateValue').text(value).hide().fadeIn(500);
        $('#heartRateCard').addClass('pulse-animation');
        setTimeout(() => $('#heartRateCard').removeClass('pulse-animation'), 500);
        
        // Send to server
        this.sendReadingToServer({
            deviceId: deviceId,
            deviceType: 'heart_rate',
            value: value,
            unit: 'BPM',
            notes: `From ${deviceName || 'Heart Rate Monitor'}`
        });
    }

    // Handle Temperature data
    handleTemperatureData(deviceId, deviceName, value) {
        console.log(`Temperature: ${value.toFixed(1)} °C`);
        
        // Update UI with jQuery animation
        $('#temperatureValue').text(value.toFixed(1)).hide().fadeIn(500);
        $('#temperatureCard').addClass('pulse-animation');
        setTimeout(() => $('#temperatureCard').removeClass('pulse-animation'), 500);
        
        // Send to server
        this.sendReadingToServer({
            deviceId: deviceId,
            deviceType: 'thermometer',
            value: value,
            unit: '°C',
            notes: `From ${deviceName || 'Thermometer'}`
        });
    }

    // Simulate ESP32 data (since actual implementation would need custom UUIDs)
    startESP32Simulation(deviceId, deviceName) {
        let counter = 0;
        const interval = setInterval(() => {
            if (!this.devices.has(deviceId)) {
                clearInterval(interval);
                return;
            }
            
            // Simulate sensor readings
            const value = 50 + Math.random() * 50;
            counter++;
            
            console.log(`ESP32 Sensor: ${value.toFixed(2)} units`);
            
            // Update UI with jQuery animation
            $('#esp32Value').text(value.toFixed(1)).hide().fadeIn(500);
            $('#esp32Card').addClass('pulse-animation');
            setTimeout(() => $('#esp32Card').removeClass('pulse-animation'), 500);
            
            // Send to server
            this.sendReadingToServer({
                deviceId: deviceId,
                deviceType: 'esp32',
                value: value,
                unit: 'units',
                notes: `Reading #${counter} from ${deviceName || 'ESP32'}`
            });
        }, 3000);
    }

    // Send reading to server using jQuery AJAX
    sendReadingToServer(reading) {
        $.ajax({
            url: '/Health/AddReading',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(reading),
            success: function(response) {
                console.log('Reading saved:', response);
                // Refresh the readings table
                if (typeof refreshReadingsTable === 'function') {
                    refreshReadingsTable();
                }
            },
            error: function(xhr, status, error) {
                console.error('Error saving reading:', error);
            }
        });
    }

    // Disconnect all devices
    disconnectAll() {
        this.devices.forEach((deviceInfo, deviceId) => {
            if (deviceInfo.server && deviceInfo.server.connected) {
                deviceInfo.server.disconnect();
            }
        });
        this.devices.clear();
        
        // Reset UI
        $('#heartRateValue').text('--');
        $('#temperatureValue').text('--');
        $('#esp32Value').text('--');
        $('#connectedDevices').empty();
        
        this.updateConnectionStatus('All devices disconnected', 'info');
    }

    // Update connection status with jQuery animate
    updateConnectionStatus(message, type) {
        const alertClass = `alert alert-${type}`;
        $('#connectionStatus')
            .removeClass()
            .addClass(alertClass)
            .text(message)
            .hide()
            .slideDown(300);
    }
}

// Export for use in other scripts
window.bluetoothDevice = new BluetoothHealthDevice();
