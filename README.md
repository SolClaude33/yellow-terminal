# 🚀 Yellow Terminal - Crypto Trading Dashboard

A modern, cyberpunk-themed cryptocurrency trading dashboard built with React, TypeScript, and Express.js.

## 🔧 Latest Updates
- Fixed CORS issues for Vercel deployment
- Removed ASTER/USD from dashboard
- Updated PUMP/USD price to current value
- Fixed server configuration for production

## ✨ Features

- **Real-time Crypto Prices**: Live data for BTC, ETH, SOL, and PUMP tokens
- **Interactive Charts**: Candlestick charts with zoom and pan functionality
- **Fear & Greed Index**: Dynamic market sentiment calculation based on price movements
- **Cyberpunk UI**: Dark theme with neon accents and matrix rain effects
- **Responsive Design**: Works on desktop and mobile devices
- **Live Market Data**: Real-time price updates every 5 seconds

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Express.js, Node.js
- **Styling**: Tailwind CSS, Custom CSS animations
- **Charts**: Chart.js with financial plugins
- **Data Fetching**: TanStack Query (React Query)
- **APIs**: CryptoCompare, CoinGecko, Birdeye

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/SolClaude33/yellow-terminal.git
cd yellow-terminal
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5000`

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - TypeScript type checking

## 🌐 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set the following environment variables:
   - `CRYPTOCOMPARE_API_KEY` - Your CryptoCompare API key
3. Deploy!

The project is configured with `vercel.json` for automatic deployment.

## 🎨 Features Overview

### Dashboard Components
- **Header**: Cyberpunk-themed header with glitch effects
- **Left Sidebar**: Live market prices and Fear & Greed index
- **Main Content**: Interactive candlestick charts with zoom/pan
- **Right Sidebar**: Portfolio and wallet information
- **Footer**: Social links and system status

### Chart Features
- Multiple timeframes (1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w, 1M)
- Zoom in/out with mouse wheel
- Pan by clicking and dragging
- Professional tooltips and animations
- Dynamic candle colors based on price movement

### Market Data
- Real-time price updates
- 24h change percentages
- Trading volume
- Market sentiment analysis

## 🔧 Configuration

### Environment Variables
- `CRYPTOCOMPARE_API_KEY` - Required for crypto data
- `PORT` - Server port (default: 5000)

### API Endpoints
- `/api/crypto/price` - Get current price for a symbol
- `/api/crypto/chart` - Get candlestick data
- `/api/crypto/market-prices` - Get multiple market prices
- `/api/crypto/fear-greed` - Get market sentiment index

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- CryptoCompare for market data API
- CoinGecko for additional crypto data
- Chart.js for chart functionality
- Tailwind CSS for styling framework

---

**Built with ❤️ for the crypto community**
