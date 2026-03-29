# Satark-Setu 🚨

**Maharashtra Live Disaster Management Dashboard**

A real-time, automated dashboard that aggregates verified updates from official government sources for Maharashtra cities.

## 🎯 Features

### Live Automated Metrics
- **Real-time Weather**: Fetches current temperature, conditions, and rainfall data from Open-Meteo API (no API key required)
- **Active Official Alerts**: Counts alerts from verified government sources
- **System Status**: Live sync indicator with auto-refresh

### Split-Screen Verification Feed
**Left Column - Verified Official Updates:**
- Live Twitter embeds from:
  - @MumbaiPolice
  - @mybmc (BMC)
  - @IMDMumbai (Weather)
  - @NDRFHQ (Disaster Response)

**Right Column - Automated News Reports:**
- RSS feed aggregation filtered for Maharashtra/Mumbai keywords
- Sources: NDTV, Times of India, Hindustan Times
- Auto-tagged as "News Report" vs "Official Update"

### Geographic Coverage
- Mumbai
- Pune
- Nagpur
- Thane
- Mira Bhayandar

## 🚀 Quick Start

### Method 1: Double-click LAUNCH.bat (EASIEST!)
Just double-click the `LAUNCH.bat` file - it opens automatically in your browser!

### Method 2: Direct Browser Access
Simply double-click `index.html` in this folder.

**NO SERVER REQUIRED!** The dashboard works completely standalone with no installation needed.

## 🔧 How It Works

### Weather Data
- Uses **Open-Meteo API** (free, no key required)
- Fetches real-time data for selected city coordinates
- Auto-refreshes every 30 seconds
- Detects severe weather and updates alert count

### News Aggregation
- Parses RSS feeds from major Indian news sources
- Filters content using keywords: Mumbai, Maharashtra, disaster, flood, rain, etc.
- Displays only Maharashtra-relevant news
- Auto-refreshes every 5 minutes

### Twitter Embeds
- Uses official Twitter widget.js
- Live updating timelines from government sources
- No API key required
- Automatically refreshes as officials post updates

## 📊 Auto-Refresh Schedule

| Data Type | Refresh Interval |
|-----------|------------------|
| Weather   | 30 seconds       |
| News      | 5 minutes        |
| Alert Count | 1 minute       |
| Twitter   | Live (embed)     |

## 🎨 UI Features

- Emergency response color scheme (red/orange accents)
- Responsive design for mobile/desktop
- Green pulse animation for "Live Sync Active" status
- Clean, professional aesthetic
- Region selector dropdown

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Styling**: Tailwind CSS (via CDN)
- **Weather API**: Open-Meteo (free, no-key)
- **News**: RSS feeds via CORS proxy
- **Social**: Twitter embedded widgets
- **Deployment Ready**: Vercel-compatible

## 📱 Mobile Responsive

The dashboard is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile phones

## ⚠️ Important Notes

1. **CORS Proxy**: The demo uses a public CORS proxy for RSS feeds. For production, consider:
   - Setting up your own proxy server
   - Using Next.js API routes
   - Backend RSS parser

2. **Twitter Widgets**: May take a few seconds to load initially

3. **Browser Compatibility**: Works best in modern browsers (Chrome, Firefox, Edge, Safari)

## 🔐 Privacy & Security

- No user data collection
- No cookies or tracking
- All data fetched from public government sources
- Client-side only (no backend required for demo)

## 🚧 Production Recommendations

For a production deployment, consider:

1. **Next.js Migration**: Use the Next.js version for better performance
2. **API Routes**: Implement server-side RSS parsing
3. **Caching**: Add Redis or similar for rate limiting
4. **Error Handling**: Enhanced error states and fallbacks
5. **Accessibility**: ARIA labels and keyboard navigation
6. **PWA Support**: Offline capabilities

## 📄 License

This project is created for educational/demonstration purposes.

## 🤝 Contributing

This is a prototype. For production features, consider:
- Adding more official sources
- Regional language support (Marathi, Hindi)
- Push notifications for severe weather
- Historical data visualization

## 📞 Support

For questions or issues, please refer to the inline code comments.

---

**Built with ❤️ for Maharashtra's safety**

*Last Updated: March 29, 2026*
