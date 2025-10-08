# 暗池 | Dark Pool - Ultra-Dark Crypto Trading Terminal

An ultra-dark, cyberpunk-themed cryptocurrency trading dashboard with real-time market data, built with React, TypeScript, and Express.js.

## 🌑 Dark Pool Features

暗池 (Àn Chí) means "Dark Pool" in Chinese - representing hidden liquidity and deep market insights.

### 🎨 Ultra-Dark Theme
- **Pitch Black Background**: Minimal eye strain with pure dark aesthetics
- **Purple & Gold Accents**: Cyberpunk neon glow effects
- **Matrix Rain Effects**: Dynamic background animations
- **Glitch Text**: Retro-futuristic visual effects

### 📊 Real-Time Market Data
- **Live Crypto Prices**: BTC, ETH, BNB, and FOUR tokens
- **Dynamic Charts**: Interactive candlestick charts with zoom/pan
- **Market Sentiment**: Intelligent calculation based on 24h price movements
- **Wallet Integration**: Connect MetaMask and view your holdings
- **Portfolio Analyzer**: Track your top holdings and P&L

## ✨ Key Features

### 🔮 Intelligent Market Sentiment
Calculates market sentiment in real-time using:
- **Weighted Algorithm**: BTC (40%), ETH (30%), BNB (20%), FOUR (10%)
- **7 Sentiment Levels**: From Extreme Fear to Extreme Greed
- **Live Updates**: Refreshes every 30 seconds
- **Price-Based Analysis**: No external APIs needed

### 💰 Wallet Features
- **MetaMask Integration**: Connect your wallet with one click
- **Real Balance Display**: See your BNB holdings in real-time
- **USD Conversion**: Live price conversion
- **24h P&L**: Track your portfolio performance
- **Top Holdings**: View your best performing assets

### 📈 Advanced Charts
- **Multiple Timeframes**: 1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w, 1M
- **Interactive Controls**: Zoom, pan, and explore price history
- **Real-Time Updates**: Live candlestick data
- **Professional Design**: Trading-grade chart interface

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Express.js, Node.js
- **Styling**: Tailwind CSS, Custom CSS animations
- **Charts**: Chart.js with financial plugins
- **Data Fetching**: TanStack Query (React Query)
- **APIs**: CryptoCompare, CoinGecko, DexScreener, BSC RPC
- **Web3**: MetaMask, Ethereum/BSC wallet integration

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
   - `CRYPTOCOMPARE_API_KEY` - Your CryptoCompare API key (optional)
3. Deploy!

The project is configured with `vercel.json` for automatic deployment.

## 🎨 Dashboard Components

### 🔝 Header
- Cyberpunk glitch effects
- Contract address display with copy function
- System status indicators

### 📊 Left Sidebar
- Live market prices for major cryptos
- Real-time price updates
- Meme corner with crypto art

### 🖥️ Main Content
- Interactive candlestick charts
- Market sentiment indicator
- Buy/Sell action buttons
- Latest market updates

### 👤 Right Sidebar
- Wallet connection interface
- Balance display (BNB & USD)
- 24h P&L tracking
- Top holdings portfolio

### ⚡ Footer
- Connection status
- Live data indicators
- Social media links
- System information

## 🔧 Configuration

### Environment Variables
- `CRYPTOCOMPARE_API_KEY` - Optional for additional crypto data
- `PORT` - Server port (default: 5000)

### API Endpoints
- `/api/crypto/price` - Get current price for a symbol
- `/api/crypto/chart` - Get candlestick data
- `/api/crypto/market-prices` - Get multiple market prices
- `/api/test/wallet-balance` - Test wallet balance fetching
- `/api/bsc-rpc-proxy` - BSC blockchain RPC proxy

## 🎯 Market Sentiment Algorithm

The Dark Pool uses an intelligent weighted algorithm to calculate market sentiment:

```typescript
Sentiment Score = (BTC_change * 0.4) + (ETH_change * 0.3) + (BNB_change * 0.2) + (FOUR_change * 0.1)
```

### Sentiment Levels:
- **0-19**: 😱 Extreme Fear - Market panic, potential buying opportunity
- **20-34**: 📉 Fear - Strong bearish sentiment across markets
- **35-44**: 😟 Cautious - Negative sentiment with some concern
- **45-54**: 😐 Neutral - Balanced market sentiment
- **55-64**: 😊 Optimistic - Positive sentiment with moderate optimism
- **65-79**: 📈 Greed - Strong bullish sentiment across major assets
- **80-100**: 🔥 Extreme Greed - Market extremely bullish, caution advised

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
- DexScreener for real-time DEX data (especially FOUR token)
- Binance Smart Chain for RPC endpoints
- Chart.js for chart functionality
- Tailwind CSS for styling framework
- MetaMask for wallet integration

---

**暗池 | Built with 🖤 for the crypto community**
