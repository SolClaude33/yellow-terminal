# Cyberpunk Crypto Trading Dashboard

## Overview

This is a full-stack cyberpunk-themed cryptocurrency trading dashboard built with React, Express, and TypeScript. It offers real-time cryptocurrency data visualization with a dark, neon-accented interface, inspired by retro-futuristic terminal aesthetics. Key features include live price data, candlestick charts, market sentiment, and BSC wallet integration for personalized portfolio tracking and user profiles. The project aims to provide an immersive command center experience for crypto trading.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

- **Framework**: React 18 with TypeScript
- **State Management**: TanStack Query for server state
- **UI**: shadcn/ui components, Tailwind CSS with a custom cyberpunk theme
- **Design**: Dark gradients, neon accents, custom CSS effects (scanlines, CRT glow, matrix rain), and cyberpunk typography (Orbitron, Share Tech Mono, Roboto Mono).
- **Layout**: Responsive CSS Grid with header, left/right sidebars, and main content.

### Backend

- **Framework**: Express.js with TypeScript
- **Module System**: ES Modules
- **API**: Minimal REST API with `/api` prefix, utilizing middleware for JSON parsing and logging.
- **Storage**: In-memory `MemStorage` for user data, designed for easy extension to database-backed solutions.

### Data Storage

- **Database**: Drizzle ORM configured for PostgreSQL (via Neon serverless PostgreSQL).
- **Schema**: Users table with UUIDs, username, and password. Zod schemas for validation.
- **Migration**: Drizzle Kit for database migration management.

### BSC Wallet Integration

- **Backend Proxies**:
    - `/api/bsc-rpc-proxy`: Bypasses CORS for BSC RPC calls (e.g., `getBalance`, token balance queries).
    - Token price fetching via CryptoCompare and CoinGecko APIs.
- **Wallet Profiles API**: REST API for creating, fetching, updating, and deleting user profiles associated with BSC wallet addresses, including username management and uniqueness validation.
- **Frontend Wallet Infrastructure**:
    - `WalletContext`: Manages BSC wallet connection state (MetaMask), auto-reconnect, and event handling.
    - **Hooks**: `useWallet`, `useWalletBalance`, `usePortfolioAnalyzer` (top 3 token holdings), `usePnLCalculator` (24h profit/loss), `useWalletProfile`.
- **Features**: Wallet connection, real-time blockchain data (BNB balance, token holdings), portfolio analysis, 24h PnL calculation, and user profiles with custom usernames.

### Trading Symbol Selection

- **Context**: `TradingSymbolContext` manages the globally selected trading symbol.
- **Backend Data Sourcing** (Multi-tiered):
    - **Tier 1 - CryptoCompare API**: Primary for major cryptocurrencies (BTC, ETH, BNB, SOL) with real-time prices and candlestick data (histominute endpoint with 5-minute aggregation).
    - **Tier 2 - Birdeye API**: Used only for Solana-native tokens (PUMP, wrapped SOL) with real-time on-chain data. Not used for BSC tokens. Requires `BIRDEYE_API_KEY` environment variable.
    - **Tier 3 - CoinGecko API**: Final fallback for all symbols when other sources fail or are unavailable.
    - Proxy endpoints (`/api/crypto/price`, `/api/crypto/chart`) handle dynamic symbol requests with automatic multi-tier fallback strategy.
- **Geographic Constraints**: Replit servers face blocking from some APIs (Binance 451 errors, Dexscreener Cloudflare). Current configuration bypasses these restrictions.
- **Frontend**: Dynamic fetching and display of price/chart data based on selected symbol in `LeftSidebar`, `CandlestickChart`, and `MainContent`.
- **Supported Cryptocurrencies**: 
    - **Full support**: BTC, ETH, BNB (BSC native token), SOL, PUMP (Solana-native token via Birdeye)
    - **Limited support**: ASTER (CoinGecko fallback, subject to rate limits)

## External Dependencies

- **Cryptocurrency Data APIs**:
    - **CryptoCompare API**: Primary data source for real-time prices, 24h stats, and historical candlestick data (OHLC) for major cryptocurrencies including BNB.
    - **Birdeye API**: Solana-specific data source for on-chain token prices with real-time accuracy. Only used for Solana-native tokens, not BSC. Free tier: 30,000 compute units/month (~15,000+ price queries).
    - **CoinGecko API**: Final fallback data source for cryptocurrencies not available on CryptoCompare or Birdeye.
    - **Fear & Greed Index API** (alternative.me): Market sentiment data.
- **Charting Libraries**:
    - Chart.js v4: Core charting.
    - chartjs-chart-financial: Candlestick/OHLC charts.
    - chartjs-adapter-date-fns & date-fns: Date handling for charts.
- **UI Component Libraries**:
    - Radix UI: Accessible, unstyled component primitives.
    - lucide-react: Icon library.
    - class-variance-authority, tailwind-merge, clsx: Styling utilities.
- **Database**: Neon serverless PostgreSQL (via @neondatabase/serverless).
- **ORM**: Drizzle ORM.
- **Development Tools**: Vite, tsx, esbuild, Replit integration plugins.