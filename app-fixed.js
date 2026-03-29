// Satark-Setu Dashboard - Clean Working Version

const cityCoordinates = {
    mumbai: { lat: 19.0760, lon: 72.8777 },
    pune: { lat: 18.5204, lon: 73.8567 },
    nagpur: { lat: 21.1458, lon: 79.0882 },
    thane: { lat: 19.2183, lon: 72.9781 },
    'mira-bhayandar': { lat: 19.2952, lon: 72.8544 }
};

let currentCity = 'mumbai';
let alertCount = 0;
let darkMode = false;
let map = null;
let weatherChart = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeAll();
});

async function initializeAll() {
    try {
        initializeCitySelector();
        await initializeMap();
        await fetchWeatherData();
        updateAlertCount();
        loadDisasterInfo();
        updateStatistics();
        initializeWeatherChart();
        
        setInterval(fetchWeatherData, 30000);
        setInterval(updateAlertCount, 60000);
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

function updateStatistics() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function initializeCitySelector() {
    const selector = document.getElementById('citySelector');
    if (selector) {
        selector.addEventListener('change', function(e) {
            currentCity = e.target.value;
            fetchWeatherData();
            updateMapMarker();
        });
    }
}

async function initializeMap() {
    try {
        if (typeof L === 'undefined') {
            console.warn('Leaflet not loaded');
            return;
        }
        
        map = L.map('maharashtraMap').setView([19.7515, 75.7139], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'OpenStreetMap'
        }).addTo(map);

        Object.entries(cityCoordinates).forEach(([key, city]) => {
            L.marker([city.lat, city.lon]).addTo(map)
                .bindPopup(`<b>${city.name}</b><br>Click to select`);
        });

        map.on('click', function(e) {
            const closest = findClosestCity(e.latlng.lat, e.latlng.lng);
            if (closest) {
                currentCity = closest;
                document.getElementById('citySelector').value = closest;
                fetchWeatherData();
            }
        });
    } catch (error) {
        console.error('Map error:', error);
    }
}

function findClosestCity(lat, lon) {
    let closest = null;
    let minDist = Infinity;
    Object.entries(cityCoordinates).forEach(([key, city]) => {
        const dist = Math.sqrt(Math.pow(city.lat - lat, 2) + Math.pow(city.lon - lon, 2));
        if (dist < minDist) {
            minDist = dist;
            closest = key;
        }
    });
    return closest;
}

function updateMapMarker() {
    if (!map) return;
    const city = cityCoordinates[currentCity];
    map.setView([city.lat, city.lon], 10);
}

async function fetchWeatherData() {
    try {
        const coords = cityCoordinates[currentCity];
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&precipitation=true`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.current_weather) {
            const temp = Math.round(data.current_weather.temperature);
            const condition = getWeatherCondition(data.current_weather.weathercode);
            const precipitation = data.precipitation?.current || 0;
            
            document.getElementById('temperature').textContent = `${temp}°C`;
            document.getElementById('weatherCondition').textContent = condition;
            document.getElementById('rainfall').textContent = `Rainfall: ${precipitation.toFixed(1)} mm`;
            
            updateWeatherAlerts(data.current_weather.weathercode, precipitation);
            updateWeatherChart(data);
        }
    } catch (error) {
        console.error('Weather error:', error);
        document.getElementById('weatherCondition').textContent = 'Unavailable';
    }
}

function getWeatherCondition(code) {
    const conditions = {
        0: 'Clear Sky ☀️', 1: 'Mainly Clear', 2: 'Partly Cloudy ⛅', 3: 'Overcast ☁️',
        45: 'Foggy 🌫️', 51: 'Light Drizzle 🌦️', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
        61: 'Slight Rain 🌧️', 63: 'Moderate Rain', 65: 'Heavy Rain ⛈️',
        71: 'Slight Snow ❄️', 73: 'Moderate Snow', 75: 'Heavy Snow',
        80: 'Rain Showers', 81: 'Moderate Showers', 82: 'Violent Showers',
        95: 'Thunderstorm ⚡', 96: 'Thunderstorm with Hail', 99: 'Severe Thunderstorm'
    };
    return conditions[code] || 'Unknown';
}

function updateWeatherAlerts(weatherCode, precipitation) {
    let severityAlerts = 0;
    if ([65, 82, 95, 96, 99].includes(weatherCode)) severityAlerts += 2;
    if ([63, 81].includes(weatherCode)) severityAlerts += 1;
    if (precipitation > 50) severityAlerts += 1;
    if (precipitation > 100) severityAlerts += 2;
    
    alertCount = Math.max(alertCount, severityAlerts);
    document.getElementById('alertCount').textContent = alertCount;
    loadDisasterInfo();
}

function initializeWeatherChart() {
    try {
        const canvas = document.getElementById('weatherChart');
        if (!canvas || typeof Chart === 'undefined') {
            console.warn('Chart.js not available');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        weatherChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Now', '+1h', '+2h', '+3h', '+4h', '+5h'],
                datasets: [{
                    label: 'Temperature (°C)',
                    data: [0, 0, 0, 0, 0, 0],
                    borderColor: 'rgb(251, 146, 60)',
                    backgroundColor: 'rgba(251, 146, 60, 0.2)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgb(251, 146, 60)',
                    pointBorderColor: 'white',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { 
                        display: true,
                        labels: { color: '#374151', font: { size: 14, weight: 'bold' } }
                    }
                },
                scales: {
                    y: { 
                        beginAtIndex: false,
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        ticks: { color: '#374151' }
                    },
                    x: { 
                        grid: { display: false },
                        ticks: { color: '#374151' }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Chart error:', error);
    }
}

function updateWeatherChart(data) {
    if (!weatherChart || !data.hourly) return;
    
    const currentHour = new Date().getHours();
    const temps = [];
    for (let i = 0; i < 6; i++) {
        const hourIndex = currentHour + i;
        if (hourIndex < data.hourly.time.length) {
            temps.push(Math.round(data.hourly.temperature_2m[hourIndex]));
        } else {
            temps.push(Math.round(data.current_weather.temperature));
        }
    }
    
    weatherChart.data.datasets[0].data = temps;
    weatherChart.update();
}

function loadDisasterInfo() {
    const container = document.getElementById('disasterInfo');
    if (!container) return;
    
    const updates = [
        {
            icon: '🌊',
            title: 'Flood Situation',
            status: alertCount > 2 ? 'HIGH RISK' : 'MONITORING',
            statusColor: alertCount > 2 ? 'bg-red-500' : 'bg-yellow-500',
            image: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=500&h=300&fit=crop',
            headline: alertCount > 2 ? 'Heavy Rainfall Warning' : 'Normal Conditions',
            details: 'Low-lying areas in Mumbai and Thane at risk during monsoon season.',
            source: 'IMD Mumbai',
            updated: '30 min ago'
        },
        {
            icon: '🌀',
            title: 'Cyclone Watch',
            status: 'ACTIVE MONITORING',
            statusColor: 'bg-blue-500',
            image: 'https://images.unsplash.com/photo-1599940824399-b87987ce0799?w=500&h=300&fit=crop',
            headline: 'Arabian Sea Conditions Tracked',
            details: 'IMD monitoring low pressure areas. Fishermen advised caution.',
            source: 'IMD Pune',
            updated: '1 hour ago'
        },
        {
            icon: '🌧️',
            title: 'Rainfall Update',
            status: 'SEASONAL',
            statusColor: 'bg-purple-500',
            image: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=500&h=300&fit=crop',
            headline: 'Monsoon Progress Normal',
            details: 'Moderate rainfall recorded across Konkan division in past 24 hours.',
            source: 'Weather Station',
            updated: '15 min ago'
        },
        {
            icon: '⚠️',
            title: 'Safety Advisory',
            status: 'ACTIVE ALERT',
            statusColor: 'bg-orange-500',
            image: 'https://images.unsplash.com/photo-1626017419099-39bd5af520a6?w=500&h=300&fit=crop',
            headline: 'Emergency Teams Ready',
            details: 'NDRF teams deployed across Maharashtra. Helplines operational 24/7.',
            source: 'NDRF',
            updated: '2 hours ago'
        }
    ];

    container.innerHTML = updates.map(u => `
        <div class="relative overflow-hidden rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1" style="min-height: 350px;">
            <div class="absolute inset-0">
                <img src="${u.image}" alt="${u.title}" class="w-full h-full object-cover opacity-90 hover:scale-110 transition-transform duration-500">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
            </div>
            <div class="relative z-10 p-6 flex flex-col h-full justify-between text-white" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
                <div>
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-center space-x-2">
                            <span class="text-4xl">${u.icon}</span>
                            <div>
                                <h3 class="text-lg font-bold">${u.title}</h3>
                                <p class="text-xs text-gray-300">${u.source}</p>
                            </div>
                        </div>
                        <span class="${u.statusColor} px-3 py-1.5 rounded-full text-xs font-bold">${u.status}</span>
                    </div>
                    <div class="bg-white/10 backdrop-blur-md rounded-lg p-3 mb-3 border border-white/20">
                        <h4 class="text-sm font-semibold text-yellow-300 mb-1">UPDATE:</h4>
                        <p class="text-base font-bold leading-tight">${u.headline}</p>
                    </div>
                    <p class="text-sm text-gray-200 leading-relaxed">${u.details}</p>
                </div>
                <div class="flex justify-between items-center pt-3 border-t border-white/20">
                    <span class="text-xs text-gray-300">Updated ${u.updated}</span>
                    <button onclick="showDetails('${u.title}')" class="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-xs font-semibold transition-all">More Info</button>
                </div>
            </div>
        </div>
    `).join('');
}

function showDetails(type) {
    const details = {
        'Flood Situation': 'FLOOD INFO:\n• Water level monitoring active\n• Emergency boats in coastal areas\n• Helpline: 1916 (BMC)\n• Avoid waterlogged areas',
        'Cyclone Watch': 'CYCLONE INFO:\n• Arabian Sea under surveillance\n• Fishing operations affected\n• Coastal residents stay alert\n• Updates every 3 hours',
        'Rainfall Update': 'RAINFALL INFO:\n• Last 24hrs: Moderate rain\n• Next 24hrs: Heavy rain predicted\n• Check local advisories\n• Traffic updates on news',
        'Safety Advisory': 'ADVISORY INFO:\n• NDRF: 011-24363260\n• State control room active\n• Hospitals on standby\n• Emergency supplies ready'
    };
    alert(details[type] || 'No additional information available');
}

function updateAlertCount() {
    const baseAlerts = Math.floor(Math.random() * 3);
    alertCount = baseAlerts;
    document.getElementById('alertCount').textContent = alertCount;
    loadDisasterInfo();
}

function toggleDarkMode() {
    darkMode = !darkMode;
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode);
    
    if (weatherChart) {
        const color = darkMode ? '#f1f5f9' : '#374151';
        weatherChart.options.plugins.legend.labels.color = color;
        weatherChart.options.scales.y.grid.color = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
        weatherChart.options.scales.y.ticks.color = color;
        weatherChart.options.scales.x.ticks.color = color;
        weatherChart.update();
    }
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    if (modalId === 'qrModal') generateQRCode();
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function generateQRCode() {
    try {
        const qrContainer = document.getElementById('qrcode');
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, {
            text: window.location.href || 'https://satark-setu.vercel.app',
            width: 200,
            height: 200
        });
    } catch (error) {
        console.error('QR Code error:', error);
    }
}

console.log('Satark-Setu Dashboard Loaded Successfully!');
console.log('Features: Live Weather, Map, Disaster Info, Dark Mode');
