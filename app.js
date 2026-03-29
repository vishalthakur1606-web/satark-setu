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
        // Using multiple CORS proxies for reliability
        const proxies = [
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?',
            'https://thingproxy.freeboard.io/fetch/'
        ];
        
        const feedPromises = rssFeeds.map(feed => 
            fetchNewsFromFeed(feed, proxies)
        );
        
        const results = await Promise.all(feedPromises);
        const allNews = results.flat().filter(news => 
            isMaharashtraRelated(news.title + ' ' + news.description)
        ).sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first
        
        displayNewsFeed(allNews.slice(0, 12)); // Show top 12 relevant items
        
    } catch (error) {
        console.error('Error fetching news feeds:', error);
        newsContainer.innerHTML = `
            <div class="text-center text-red-500 py-4">
                <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <p>Unable to load news right now.</p>
                <button onclick="fetchNewsFeeds()" class="mt-2 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">Retry</button>
            </div>
        `;
    }
}

// Fetch news from individual feed with fallback proxies
async function fetchNewsFromFeed(feed, proxies) {
    for (const proxy of proxies) {
        try {
            const response = await fetch(proxy + encodeURIComponent(feed.url), {
                timeout: 5000
            });
            if (response.ok) {
                const xml = await response.text();
                return parseRSS(xml, feed.name);
            }
        } catch (err) {
            continue; // Try next proxy
        }
    }
    return [];
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
        
        // Try to extract image from different RSS elements
        let imageUrl = null;
        
        // Check for media:content
        const mediaContent = item.querySelector('content\\:url, media\\:content');
        if (mediaContent) {
            imageUrl = mediaContent.getAttribute('url');
        }
        
        // Check for media:thumbnail
        if (!imageUrl) {
            const mediaThumbnail = item.querySelector('media\\:thumbnail');
            if (mediaThumbnail) {
                imageUrl = mediaThumbnail.getAttribute('url');
            }
        }
        
        // Check for enclosure
        if (!imageUrl) {
            const enclosure = item.querySelector('enclosure');
            if (enclosure && enclosure.getAttribute('type')?.startsWith('image/')) {
                imageUrl = enclosure.getAttribute('url');
            }
        }
        
        // Extract first image from description if no dedicated image field
        if (!imageUrl) {
            const imgMatch = description.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch) {
                imageUrl = imgMatch[1];
            }
        }
        
        // Clean description - remove HTML tags but keep it readable
        const cleanDescription = description
            .replace(/<img[^>]*>/g, '')  // Remove image tags
            .replace(/<br[^>]*>/g, '\n')  // Convert br to newlines
            .replace(/<\/?[^>]+(>|$)/g, '')  // Remove remaining HTML
            .trim();
        
        news.push({
            title: decodeHTML(title),
            description: decodeHTML(cleanDescription),
            link: link,
            pubDate: pubDate,
            source: sourceName,
            timestamp: new Date(pubDate),
            imageUrl: imageUrl
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
    
    newsItems.forEach((item, index) => {
        const newsCard = document.createElement('div');
        newsCard.className = 'bg-white border-l-4 border-orange-400 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden mb-3';
        newsCard.style.scrollMarginTop = '1rem';
        
        const timeAgo = getTimeAgo(item.timestamp);
        const hasImage = item.imageUrl !== null;
        
        // Create unique ID for each article
        const articleId = `article-${index}`;
        
        newsCard.innerHTML = `
            <div onclick="toggleArticle('${articleId}')">
                ${hasImage ? `
                    <div class="relative h-48 overflow-hidden bg-gray-200">
                        <img src="${item.imageUrl}" alt="${item.title}" 
                             class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                             onerror="this.parentElement.style.display='none'">
                        <div class="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded font-semibold">
                            News Report
                        </div>
                    </div>
                ` : `
                    <div class="relative p-4 bg-orange-50">
                        <div class="flex justify-between items-start">
                            <span class="bg-orange-500 text-white text-xs px-2 py-1 rounded font-semibold">
                                News Report
                            </span>
                            <span class="text-xs text-gray-500">${timeAgo}</span>
                        </div>
                    </div>
                `}
                
                <div class="p-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-semibold text-orange-600 uppercase tracking-wide">${item.source}</span>
                        ${!hasImage ? `<span class="text-xs text-gray-500">${timeAgo}</span>` : ''}
                    </div>
                    
                    <h4 class="font-bold text-gray-800 text-base mb-2 line-clamp-2 hover:text-orange-600 transition-colors">
                        ${item.title}
                    </h4>
                    
                    <p class="text-sm text-gray-600 mb-3 line-clamp-3" id="preview-${articleId}">
                        ${item.description.substring(0, 150)}${item.description.length > 150 ? '...' : ''}
                    </p>
                    
                    <div class="flex items-center justify-between">
                        <button class="text-orange-600 hover:text-orange-700 text-sm font-semibold flex items-center">
                            <span>Read Full Story</span>
                            <svg class="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </button>
                        ${hasImage ? `<span class="text-xs text-gray-500">${timeAgo}</span>` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Expanded content (hidden by default) -->
            <div id="${articleId}" class="hidden border-t border-gray-200 bg-gray-50">
                <div class="p-4">
                    <h5 class="font-semibold text-gray-700 mb-2">Full Article:</h5>
                    <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-4">
                        ${item.description}
                    </p>
                    <a href="${item.link}" target="_blank" rel="noopener noreferrer" 
                       class="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                        Open Original Source
                    </a>
                    <button onclick="toggleArticle('${articleId}')" 
                            class="ml-2 text-gray-600 hover:text-gray-800 text-sm font-semibold underline">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(newsCard);
    });
}

// Toggle article expansion
function toggleArticle(articleId) {
    const article = document.getElementById(articleId);
    if (article.classList.contains('hidden')) {
        article.classList.remove('hidden');
        article.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        article.classList.add('hidden');
    }
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
