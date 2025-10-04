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
  try {
    const response = await fetch(`/api/crypto/price?symbol=${encodeURIComponent(symbol)}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Error fetching ${symbol} price:`, errorData.error || response.statusText);
      throw new Error(errorData.error || 'Failed to fetch price data');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${symbol} price:`, error);
    // Only fallback to BNB if requesting BNB, otherwise throw
    if (symbol === 'BNB/USD') {
      return getBNBPrice();
    }
    throw error;
  }
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
  try {
    const response = await fetch('/api/crypto/fear-greed');
    
    if (!response.ok) {
      throw new Error('Failed to fetch Fear & Greed data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Fear & Greed Index:', error);
    return {
      value: 75,
      classification: 'Greed',
      timestamp: Date.now(),
    };
  }
}

// Get candlestick data via our backend proxy
export async function getRealTimeCandles(timeframe: string, symbol: string = 'BNB/USD'): Promise<CandlestickData[]> {
  try {
    const response = await fetch(`/api/crypto/chart?timeframe=${timeframe}&symbol=${encodeURIComponent(symbol)}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Error fetching ${symbol} chart:`, errorData.error || response.statusText);
      throw new Error(errorData.error || 'Failed to fetch candlestick data');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${symbol} candles:`, error);
    throw error;
  }
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
  try {
    const response = await fetch('/api/crypto/market-prices', {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch market prices');
    }
    
    const result = await response.json();
    // Handle new response structure with timestamp
    return result.data || result;
  } catch (error) {
    console.error('Error fetching market prices:', error);
    // Try to get individual prices as fallback
    try {
      const [btcPrice, ethPrice, bnbPrice] = await Promise.allSettled([
        getRealTimePrice('BTC/USD'),
        getRealTimePrice('ETH/USD'), 
        getRealTimePrice('BNB/USD')
      ]);
      
      return [
        { 
          symbol: 'BTC/USD', 
          price: btcPrice.status === 'fulfilled' ? btcPrice.value.current_price : 114082, 
          change: btcPrice.status === 'fulfilled' ? btcPrice.value.price_change_percentage_24h : 3.55 
        },
        { 
          symbol: 'ETH/USD', 
          price: ethPrice.status === 'fulfilled' ? ethPrice.value.current_price : 4112.48, 
          change: ethPrice.status === 'fulfilled' ? ethPrice.value.price_change_percentage_24h : 2.44 
        },
        { 
          symbol: 'BNB/USD', 
          price: bnbPrice.status === 'fulfilled' ? bnbPrice.value.current_price : 650.00, 
          change: bnbPrice.status === 'fulfilled' ? bnbPrice.value.price_change_percentage_24h : 0.85 
        },
        { symbol: 'FOUR', price: 0.00703518, change: 31.33 },
      ];
    } catch (fallbackError) {
      console.error('Fallback price fetch failed:', fallbackError);
      // Final fallback with realistic prices
      return [
        { symbol: 'BTC/USD', price: 114082, change: 3.55 },
        { symbol: 'ETH/USD', price: 4112.48, change: 2.44 },
        { symbol: 'BNB/USD', price: 650.00, change: 0.85 },
        { symbol: 'FOUR', price: 0.00703518, change: 31.33 },
      ];
    }
  }
}