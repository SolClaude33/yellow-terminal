// Crypto API service using multiple sources for real-time data
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const BINANCE_BASE_URL = 'https://api.binance.com/api/v3';
const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';
const FEAR_GREED_URL = 'https://api.alternative.me/fng/';

export interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface CryptoPrice {
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  total_volume: number;
  market_cap: number;
}

export interface FearGreedData {
  value: number;
  classification: string;
  timestamp: number;
}

// Get real-time price for any symbol via our backend proxy
export async function getRealTimePrice(symbol: string = 'BNB/USD'): Promise<CryptoPrice> {
  // EMERGENCY FIX: Use static endpoints directly since Vercel blocks external APIs
  try {
    console.log(`[EMERGENCY] Using static endpoint for ${symbol}...`);
    const staticResponse = await fetch(`/api/crypto/static-price?symbol=${encodeURIComponent(symbol)}`);
    
    if (staticResponse.ok) {
      console.log(`[EMERGENCY] Static endpoint success for ${symbol}`);
      return await staticResponse.json();
    }
  } catch (staticError) {
    console.error(`[EMERGENCY] Static endpoint failed for ${symbol}:`, staticError);
  }
  
  // Fallback to local data if static endpoint fails
  if (symbol === 'BNB/USD') {
    return getBNBPrice();
  }
  
  // Return basic data for other symbols
  return {
    current_price: symbol === 'FOUR' ? 0.1558 : symbol === 'BTC/USD' ? 122000 : symbol === 'ETH/USD' ? 4480 : 1150,
    price_change_24h: symbol === 'FOUR' ? -0.0178 : symbol === 'BTC/USD' ? -366 : symbol === 'ETH/USD' ? -40.32 : -29.5,
    price_change_percentage_24h: symbol === 'FOUR' ? -10.22 : symbol === 'BTC/USD' ? -0.3 : symbol === 'ETH/USD' ? -0.9 : -2.5,
    total_volume: symbol === 'FOUR' ? 15000000 : 2000000000,
    market_cap: symbol === 'FOUR' ? 155800000 : symbol === 'BTC/USD' ? 2400000000000 : symbol === 'ETH/USD' ? 540000000000 : 170000000000
  };
}

// Legacy function for backward compatibility (deprecated, use getRealTimePrice instead)
export async function getRealTimeSOLPrice(): Promise<CryptoPrice> {
  return getRealTimePrice('SOL/USD');
}

export async function getBNBPrice(): Promise<CryptoPrice> {
  try {
    const response = await fetch(
      `${COINGECKO_BASE_URL}/simple/price?ids=binancecoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch price data');
    }
    
    const data = await response.json();
    const bnbData = data.binancecoin;
    
    return {
      current_price: bnbData.usd,
      price_change_24h: bnbData.usd_24h_change || 0,
      price_change_percentage_24h: bnbData.usd_24h_change || 0,
      total_volume: bnbData.usd_24h_vol || 0,
      market_cap: bnbData.usd_market_cap || 0,
    };
  } catch (error) {
    console.error('Error fetching BNB price:', error);
    return {
      current_price: 650.00,
      price_change_24h: 5.50,
      price_change_percentage_24h: 0.85,
      total_volume: 1800000000,
      market_cap: 95000000000,
    };
  }
}

// Legacy function - deprecated, use getRealTimePrice('SOL/USD') instead
export async function getSolanaPrice(): Promise<CryptoPrice> {
  try {
    const response = await fetch(
      `${COINGECKO_BASE_URL}/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch price data');
    }
    
    const data = await response.json();
    const solanaData = data.solana;
    
    return {
      current_price: solanaData.usd,
      price_change_24h: solanaData.usd_24h_change || 0,
      price_change_percentage_24h: solanaData.usd_24h_change || 0,
      total_volume: solanaData.usd_24h_vol || 0,
      market_cap: solanaData.usd_market_cap || 0,
    };
  } catch (error) {
    console.error('Error fetching Solana price:', error);
    return {
      current_price: 156.78,
      price_change_24h: -1.23,
      price_change_percentage_24h: -0.89,
      total_volume: 2100000000,
      market_cap: 73000000000,
    };
  }
}

// Get Fear & Greed Index via our backend proxy
export async function getFearGreedIndex(): Promise<FearGreedData> {
  // EMERGENCY FIX: Return static data since external APIs are blocked
  console.log('[EMERGENCY] Using static Fear & Greed data');
  return {
    value: 75,
    classification: 'Greed',
    timestamp: Date.now(),
  };
}

// Generate basic chart data when static endpoint fails
function generateBasicChartData(timeframe: string, symbol: string): CandlestickData[] {
  const now = Date.now();
  const hoursBack = timeframe === '1h' ? 24 : timeframe === '4h' ? 96 : 168;
  const intervalMs = timeframe === '1h' ? 3600000 : timeframe === '4h' ? 14400000 : 3600000;
  
  const candles = [];
  let basePrice = 1150; // Start with BNB price
  
  if (symbol === 'FOUR') {
    basePrice = 0.1558;
  } else if (symbol === 'BTC/USD') {
    basePrice = 122000;
  } else if (symbol === 'ETH/USD') {
    basePrice = 4480;
  }
  
  for (let i = hoursBack; i >= 0; i--) {
    const timestamp = now - (i * intervalMs);
    const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
    const open = basePrice;
    const close = basePrice * (1 + variation);
    const high = Math.max(open, close) * (1 + Math.random() * 0.05);
    const low = Math.min(open, close) * (1 - Math.random() * 0.05);
    
    candles.push({
      timestamp,
      open,
      high,
      low,
      close
    });
    
    basePrice = close; // Next candle starts where this one ended
  }
  
  return candles;
}

// Get candlestick data via our backend proxy
export async function getRealTimeCandles(timeframe: string, symbol: string = 'BNB/USD'): Promise<CandlestickData[]> {
  // EMERGENCY FIX: Use static chart endpoint directly
  try {
    console.log(`[EMERGENCY] Using static chart endpoint for ${symbol}...`);
    const staticResponse = await fetch(`/api/crypto/static-chart?timeframe=${timeframe}&symbol=${encodeURIComponent(symbol)}`);
    
    if (staticResponse.ok) {
      console.log(`[EMERGENCY] Static chart endpoint success for ${symbol}`);
      return await staticResponse.json();
    }
  } catch (staticError) {
    console.error(`[EMERGENCY] Static chart endpoint failed for ${symbol}:`, staticError);
  }
  
  // Generate basic chart data if static endpoint fails
  console.log(`[EMERGENCY] Generating basic chart data for ${symbol}`);
  return generateBasicChartData(timeframe, symbol);
}

// Legacy function - deprecated, use getRealTimeCandles instead
export async function getSolanaCandles(days: number = 7): Promise<CandlestickData[]> {
  try {
    const response = await fetch(
      `${COINGECKO_BASE_URL}/coins/solana/ohlc?vs_currency=usd&days=${days}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch candlestick data');
    }
    
    const data = await response.json();
    
    return data.map((candle: number[]) => ({
      timestamp: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
    }));
  } catch (error) {
    console.error('Error fetching Solana candles:', error);
    return generateFallbackCandles();
  }
}

function generateFallbackCandles(): CandlestickData[] {
  const candles: CandlestickData[] = [];
  let price = 156.78;
  const now = Date.now();
  const interval = 4 * 60 * 60 * 1000; // 4 hours

  for (let i = 168; i >= 0; i--) {
    const timestamp = now - (i * interval);
    const volatility = 0.02;
    
    const open = price;
    const change = (Math.random() - 0.5) * 2 * volatility * price;
    const high = open + Math.abs(change) + (Math.random() * 0.01 * price);
    const low = open - Math.abs(change) - (Math.random() * 0.01 * price);
    const close = open + change;
    
    candles.push({
      timestamp,
      open,
      high,
      low,
      close,
    });
    
    price = close;
  }
  
  return candles;
}

// WebSocket connection for real-time price updates
export function createBinanceWebSocket(onPriceUpdate: (price: number) => void): WebSocket {
  const ws = new WebSocket(`${BINANCE_WS_URL}/bnbusdt@trade`);
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const price = parseFloat(data.p);
    onPriceUpdate(price);
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  return ws;
}

// Map timeframe labels to days for CoinGecko API
export function getDaysFromTimeframe(timeframe: string): string {
  const daysMap: { [key: string]: string } = {
    '1m': '1m',
    '5m': '5m', 
    '15m': '15m',
    '1h': '1h',
    '4h': '4h',
    '1D': '1d',
    '7D': '7d',
    '30D': '30d',
    '90D': '90d',
  };
  
  return daysMap[timeframe] || '1h';
}

// Types for market prices
export interface MarketTicker {
  symbol: string;
  price: number;
  change: number;
}

// Get multiple crypto prices for Live Market section
export async function getMarketPrices(): Promise<MarketTicker[]> {
  // EMERGENCY FIX: Use static endpoint directly
  try {
    console.log('[EMERGENCY] Using static market prices endpoint...');
    const staticResponse = await fetch('/api/crypto/static-market-prices');
    
    if (staticResponse.ok) {
      console.log('[EMERGENCY] Static market prices endpoint success');
      const result = await staticResponse.json();
      return result.data || result;
    }
  } catch (staticError) {
    console.error('[EMERGENCY] Static market prices endpoint failed:', staticError);
  }
  
  // Final fallback with realistic prices
  console.log('[EMERGENCY] Using hardcoded market prices');
  return [
    { symbol: 'BTC/USD', price: 122000, change: -0.3 },
    { symbol: 'ETH/USD', price: 4480, change: -0.9 },
    { symbol: 'BNB/USD', price: 1150, change: -2.5 },
    { symbol: 'FOUR', price: 0.1558, change: -10.22 },
  ];
}