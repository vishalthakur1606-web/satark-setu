// Satark-Setu Dashboard - Live Data Automation Script

// City coordinates for Open-Meteo API
const cityCoordinates = {
    mumbai: { lat: 19.0760, lon: 72.8777 },
    pune: { lat: 18.5204, lon: 73.8567 },
    nagpur: { lat: 21.1458, lon: 79.0882 },
    thane: { lat: 19.2183, lon: 72.9781 },
    'mira-bhayandar': { lat: 19.2952, lon: 72.8544 }
};

// RSS Feed URLs (using RSS to JSON conversion service)
const rssFeeds = [
    { name: 'NDTV', url: 'https://rss.app/feeds/tJ1z9yMqKQXBpXGN.xml' },
    { name: 'Times of India', url: 'https://mumbaimirror.indiatimes.com/rssfeedstopstories.cms' },
    { name: 'Hindustan Times', url: 'https://www.hindustantimes.com/feeds/rss/mumbai-news/rssfeed.xml' }
];

// State management
let currentCity = 'mumbai';
let alertCount = 0;

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeCitySelector();
    fetchWeatherData();
    fetchNewsFeeds();
    updateAlertCount();
    
    // Auto-refresh intervals
    setInterval(fetchWeatherData, 30000); // Weather every 30 seconds
    setInterval(fetchNewsFeeds, 300000);  // News every 5 minutes
    setInterval(updateAlertCount, 60000);  // Alert count every minute
});

// City selector functionality
function initializeCitySelector() {
    const selector = document.getElementById('citySelector');
    selector.addEventListener('change', function(e) {
        currentCity = e.target.value;
        fetchWeatherData();
    });
}

// Fetch weather data from Open-Meteo API (no key required)
async function fetchWeatherData() {
    try {
        const coords = cityCoordinates[currentCity];
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&precipitation=true`;
        
        const response = await fetch(weatherUrl);
        const data = await response.json();
        
        updateWeatherDisplay(data);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        document.getElementById('weatherCondition').textContent = 'Data unavailable';
    }
}

// Update weather display in UI
function updateWeatherDisplay(data) {
    if (data.current_weather) {
        const temp = Math.round(data.current_weather.temperature);
        const condition = getWeatherCondition(data.current_weather.weathercode);
        const precipitation = data.precipitation?.current || 0;
        
        document.getElementById('temperature').textContent = `${temp}°C`;
        document.getElementById('weatherCondition').textContent = condition;
        document.getElementById('rainfall').textContent = `Rainfall: ${precipitation.toFixed(1)} mm`;
        
        // Update alert count based on weather severity
        updateWeatherAlerts(data.current_weather.weathercode, precipitation);
    }
}

// Convert weather codes to human-readable conditions
function getWeatherCondition(code) {
    const conditions = {
        0: 'Clear Sky',
        1: 'Mainly Clear',
        2: 'Partly Cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Depositing Rime Fog',
        51: 'Light Drizzle',
        53: 'Moderate Drizzle',
        55: 'Dense Drizzle',
        61: 'Slight Rain',
        63: 'Moderate Rain',
        65: 'Heavy Rain',
        71: 'Slight Snow',
        73: 'Moderate Snow',
        75: 'Heavy Snow',
        80: 'Slight Rain Showers',
        81: 'Moderate Rain Showers',
        82: 'Violent Rain Showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with Slight Hail',
        99: 'Thunderstorm with Heavy Hail'
    };
    return conditions[code] || 'Unknown';
}

// Update alerts based on weather conditions
function updateWeatherAlerts(weatherCode, precipitation) {
    let severityAlerts = 0;
    
    // Severe weather conditions
    if ([65, 82, 95, 96, 99].includes(weatherCode)) severityAlerts += 2;
    if ([63, 81].includes(weatherCode)) severityAlerts += 1;
    if (precipitation > 50) severityAlerts += 1;
    if (precipitation > 100) severityAlerts += 2;
    
    // Update the alert count (base + weather-induced)
    alertCount = Math.max(alertCount, severityAlerts);
    document.getElementById('alertCount').textContent = alertCount;
}

// Mock alert count update (in real scenario, would parse Twitter feeds)
function updateAlertCount() {
    // Simulate counting recent tweets from official sources
    // In production, this would use Twitter API v2 or parse embeds
    const baseAlerts = Math.floor(Math.random() * 3);
    alertCount = baseAlerts;
    document.getElementById('alertCount').textContent = alertCount;
}

// Fetch news from RSS feeds using CORS proxy
async function fetchNewsFeeds() {
    const newsContainer = document.getElementById('newsFeed');
    newsContainer.innerHTML = '<div class="text-center text-gray-500 py-4">Updating news...</div>';
    
    try {
        // Using a public CORS proxy for demo purposes
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const feedPromises = rssFeeds.map(feed => 
            fetch(proxyUrl + encodeURIComponent(feed.url))
                .then(res => res.text())
                .then(xml => parseRSS(xml, feed.name))
                .catch(err => {
                    console.error(`Error fetching ${feed.name}:`, err);
                    return [];
                })
        );
        
        const results = await Promise.all(feedPromises);
        const allNews = results.flat().filter(news => 
            isMaharashtraRelated(news.title + ' ' + news.description)
        );
        
        displayNewsFeed(allNews.slice(0, 15)); // Show top 15 relevant items
        
    } catch (error) {
        console.error('Error fetching news feeds:', error);
        newsContainer.innerHTML = '<div class="text-center text-red-500 py-4">Unable to load news. Retrying...</div>';
    }
}

// Parse RSS XML to extract news items
function parseRSS(xml, sourceName) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'text/xml');
    const items = xmlDoc.querySelectorAll('item');
    
    const news = [];
    items.forEach(item => {
        const title = item.querySelector('title')?.textContent || '';
        const description = item.querySelector('description')?.textContent || '';
        const link = item.querySelector('link')?.textContent || '';
        const pubDate = item.querySelector('pubDate')?.textContent || '';
        
        news.push({
            title: decodeHTML(title),
            description: decodeHTML(description.replace(/<[^>]*>/g, '')),
            link: link,
            pubDate: pubDate,
            source: sourceName,
            timestamp: new Date(pubDate)
        });
    });
    
    return news;
}

// Decode HTML entities
function decodeHTML(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}

// Filter news related to Maharashtra/Mumbai
function isMaharashtraRelated(text) {
    const keywords = [
        'mumbai', 'maharashtra', 'pune', 'nagpur', 'thane', 
        'mira bhayandar', 'disaster', 'flood', 'rain', 'cyclone',
        'ndrf', 'bmc', 'mumbai police', ' IMD', 'weather'
    ];
    
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword));
}

// Display news items in the feed
function displayNewsFeed(newsItems) {
    const container = document.getElementById('newsFeed');
    
    if (newsItems.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-4">No Maharashtra-specific news at this time</div>';
        return;
    }
    
    container.innerHTML = '';
    
    newsItems.forEach(item => {
        const newsCard = document.createElement('div');
        newsCard.className = 'border-l-4 border-orange-400 pl-3 py-2 hover:bg-orange-50 transition-colors cursor-pointer';
        newsCard.onclick = () => window.open(item.link, '_blank');
        
        const timeAgo = getTimeAgo(item.timestamp);
        
        newsCard.innerHTML = `
            <div class="flex justify-between items-start mb-1">
                <h4 class="font-semibold text-gray-800 text-sm line-clamp-2">${item.title}</h4>
                <span class="text-xs text-gray-500 ml-2 flex-shrink-0">${timeAgo}</span>
            </div>
            <p class="text-xs text-gray-600 line-clamp-2 mb-1">${item.description.substring(0, 100)}${item.description.length > 100 ? '...' : ''}</p>
            <div class="flex items-center justify-between">
                <span class="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded font-medium">News Report</span>
                <span class="text-xs text-gray-500">${item.source}</span>
            </div>
        `;
        
        container.appendChild(newsCard);
    });
}

// Get relative time string
function getTimeAgo(date) {
    if (!date) return 'Unknown';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

// Log initialization
console.log('Satark-Setu Dashboard initialized');
console.log('Live sync active for Maharashtra region');
console.log('Auto-refresh enabled: Weather (30s), News (5min)');
