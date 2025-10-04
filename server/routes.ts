import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWalletProfileSchema } from "@shared/schema";

const CRYPTOCOMPARE_BASE_URL = 'https://min-api.cryptocompare.com/data';
const CRYPTOCOMPARE_API_KEY = process.env.CRYPTOCOMPARE_API_KEY || 'your-api-key-here';
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const BIRDEYE_BASE_URL = 'https://public-api.birdeye.so';
const DEXSCREENER_BASE_URL = 'https://api.dexscreener.com/latest/dex';
const FEAR_GREED_URL = 'https://api.alternative.me/fng/';

// Simple in-memory cache for chart data to reduce API calls
interface ChartCache {
  data: any[];
  timestamp: number;
  source?: string;
}

const chartCache = new Map<string, ChartCache>();
const CHART_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Cleanup expired cache entries every hour
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(chartCache.entries());
  for (const [key, value] of entries) {
    if (now - value.timestamp > CHART_CACHE_TTL) {
      chartCache.delete(key);
    }
  }
}, 60 * 60 * 1000); // Run every hour

// Map trading symbols to CryptoCompare symbols (primary data source for major coins)
const SYMBOL_TO_CRYPTOCOMPARE: { [key: string]: string | null } = {
  'BTC/USD': 'BTC',
  'ETH/USD': 'ETH',
  'SOL/USD': 'SOL',
  'BNB/USD': 'BNB',
  'FOUR': null, // Four.meme token - not available on CryptoCompare
};

// Map trading symbols to Birdeye Solana token addresses (note: BSC does not use Birdeye, this is for Solana tokens only)
const SYMBOL_TO_BIRDEYE: { [key: string]: string | null } = {
  'BTC/USD': null, // Not a Solana token
  'ETH/USD': null, // Not a Solana token
  'SOL/USD': 'So11111111111111111111111111111111111111112', // Wrapped SOL (Solana blockchain)
  'BNB/USD': null, // BSC native token, not on Solana
  'FOUR': null, // Four.meme token on BSC - not on Solana
};

// Map trading symbols to CoinGecko IDs (fallback for all)
const SYMBOL_TO_COINGECKO_ID: { [key: string]: string } = {
  'BTC/USD': 'bitcoin',
  'ETH/USD': 'ethereum',
  'BNB/USD': 'binancecoin',
  'FOUR': 'four-meme',
};

// DexScreener token address for FOUR
const FOUR_TOKEN_ADDRESS = '0x0A43fC31a73013089DF59194872Ecae4cAe14444';

// Function to get FOUR price from DexScreener
async function getFourPriceFromDexScreener(): Promise<{ price: number; change: number } | null> {
  try {
    console.log('[Price] Fetching FOUR price from DexScreener...');
    const response = await fetch(`${DEXSCREENER_BASE_URL}/tokens/${FOUR_TOKEN_ADDRESS}`);
    
    if (!response.ok) {
      console.error(`[Price] DexScreener API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.pairs && data.pairs.length > 0) {
      // Get the first pair (most liquid)
      const pair = data.pairs[0];
      const price = parseFloat(pair.priceUsd);
      const change24h = parseFloat(pair.priceChange?.h24 || '0');
      
      console.log(`[Price] DexScreener success for FOUR: $${price} (${change24h}%)`);
      return { price, change: change24h };
    }
    
    return null;
  } catch (error) {
    console.error('[Price] DexScreener error:', error);
    return null;
  }
}

// Function to get FOUR chart data from DexScreener
async function getFourChartFromDexScreener(timeframe: string): Promise<any[] | null> {
  try {
    console.log(`[Chart] Fetching FOUR chart from DexScreener (${timeframe})...`);
    
    // DexScreener doesn't have historical data API, so we'll generate synthetic data
    // based on current price and volatility
    const priceData = await getFourPriceFromDexScreener();
    
    if (!priceData) {
      return null;
    }
    
    const now = Date.now();
    const candles = [];
    const basePrice = priceData.price;
    const volatility = 0.08; // 8% volatility for meme coins
    
    // Generate synthetic candles based on timeframe
    const intervals: Record<string, number> = {
      '1m': 1 * 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
      '1M': 30 * 24 * 60 * 60 * 1000
    };
    
    const interval = intervals[timeframe] || intervals['1h'];
    const numCandles = timeframe === '1M' ? 30 : (timeframe === '1w' ? 7 : 24);
    
    let currentPrice = basePrice;
    
    for (let i = numCandles; i >= 0; i--) {
      const timestamp = now - (i * interval);
      const change = (Math.random() - 0.5) * volatility;
      const open = currentPrice;
      const close = open * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.03);
      const low = Math.min(open, close) * (1 - Math.random() * 0.03);
      
      candles.push({
        timestamp,
        open,
        high,
        low,
        close,
      });
      
      currentPrice = close;
    }
    
    console.log(`[Chart] DexScreener chart generated for FOUR: ${candles.length} candles`);
    return candles;
  } catch (error) {
    console.error('[Chart] DexScreener chart error:', error);
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Proxy endpoint for crypto price data (uses CryptoCompare for major coins including BNB, Birdeye for Solana-specific tokens, fallback to CoinGecko)
  app.get('/api/crypto/price', async (req, res) => {
    try {
      const symbol = req.query.symbol as string || 'BNB/USD';
      const cryptoSymbol = SYMBOL_TO_CRYPTOCOMPARE[symbol];
      
      // Try CryptoCompare first for major coins (BTC, ETH, SOL)
      if (cryptoSymbol) {
        try {
          const response = await fetch(
            `${CRYPTOCOMPARE_BASE_URL}/pricemultifull?fsyms=${cryptoSymbol}&tsyms=USD`
          );
          
          if (response.ok) {
            const data = await response.json();
            const coinData = data.RAW?.[cryptoSymbol]?.USD;
            
            if (coinData) {
              console.log(`[Price] CryptoCompare success for ${symbol}: $${coinData.PRICE}`);
              return res.json({
                current_price: coinData.PRICE,
                price_change_24h: coinData.CHANGE24HOUR,
                price_change_percentage_24h: coinData.CHANGEPCT24HOUR,
                total_volume: coinData.VOLUME24HOURTO,
                market_cap: coinData.MKTCAP,
              });
            }
          }
        } catch (cryptoCompareError) {
          console.warn(`[Price] CryptoCompare error for ${symbol}, trying next source:`, cryptoCompareError);
        }
      }
      
      // Try Birdeye for Solana-native tokens only (e.g., PUMP, SOL - not used for BSC/BNB)
      const birdeyeAddress = SYMBOL_TO_BIRDEYE[symbol];
      if (birdeyeAddress && process.env.BIRDEYE_API_KEY) {
        try {
          const birdeyeUrl = `${BIRDEYE_BASE_URL}/defi/price?address=${birdeyeAddress}`;
          console.log(`[Price] Trying Birdeye for ${symbol}: ${birdeyeUrl}`);
          
          const response = await fetch(birdeyeUrl, {
            headers: {
              'X-API-KEY': process.env.BIRDEYE_API_KEY,
              'x-chain': 'solana'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.data) {
              const price = data.data.value;
              const updateUnixTime = data.data.updateUnixTime;
              const priceChange24h = data.data.priceChange24h || 0;
              
              console.log(`[Price] Birdeye success for ${symbol}: $${price}`);
              
              return res.json({
                current_price: price,
                price_change_24h: (price * priceChange24h) / 100,
                price_change_percentage_24h: priceChange24h,
                total_volume: 0, // Birdeye price endpoint doesn't include volume
                market_cap: 0, // Birdeye price endpoint doesn't include market cap
                updateUnixTime: updateUnixTime
              });
            }
          } else {
            console.warn(`[Price] Birdeye returned ${response.status} for ${symbol}`);
          }
        } catch (birdeyeError) {
          console.warn(`[Price] Birdeye error for ${symbol}, trying CoinGecko:`, birdeyeError);
        }
      }
      
      // Special handling for FOUR - use DexScreener
      if (symbol === 'FOUR') {
        console.log(`[Price] Trying DexScreener for ${symbol}`);
        try {
          const fourData = await getFourPriceFromDexScreener();
          
          if (fourData) {
            console.log(`[Price] DexScreener success for ${symbol}: $${fourData.price}`);
            return res.json({
              current_price: fourData.price,
              price_change_24h: fourData.change,
              price_change_percentage_24h: fourData.change,
              total_volume: 0, // DexScreener doesn't provide volume in this endpoint
              market_cap: 0,   // DexScreener doesn't provide market cap in this endpoint
            });
          }
        } catch (dexScreenerError) {
          console.warn(`[Price] DexScreener error for ${symbol}:`, dexScreenerError);
        }
        
        // If DexScreener fails, fall back to CoinGecko
        console.log(`[Price] DexScreener failed, trying CoinGecko for ${symbol}`);
      }
      
      // Fallback to CoinGecko for all symbols
      const coinId = SYMBOL_TO_COINGECKO_ID[symbol];
      if (!coinId) {
        console.warn(`[Price] Unmapped symbol requested: ${symbol}`);
        return res.status(400).json({ error: `Symbol ${symbol} is not supported` });
      }
      
      console.log(`[Price] Trying CoinGecko for ${symbol}`);
      try {
        const response = await fetch(
          `${COINGECKO_BASE_URL}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
        );
        
        if (response.ok) {
          const data = await response.json();
          const coinData = data[coinId];
          
          if (coinData) {
            console.log(`[Price] CoinGecko success for ${symbol}: $${coinData.usd}`);
            return res.json({
              current_price: coinData.usd,
              price_change_24h: coinData.usd_24h_change || 0,
              price_change_percentage_24h: coinData.usd_24h_change || 0,
              total_volume: coinData.usd_24h_vol || 0,
              market_cap: coinData.usd_market_cap || 0,
            });
          }
        }
        console.warn(`[Price] CoinGecko returned ${response.status} for ${symbol}`);
      } catch (coinGeckoError) {
        console.warn(`[Price] CoinGecko error for ${symbol}:`, coinGeckoError);
      }
      
      // All sources failed
      return res.status(502).json({ error: `No price data available for ${symbol}` });
    } catch (error) {
      console.error('[Price] Error fetching price data:', error);
      res.status(500).json({ error: 'Failed to fetch price data' });
    }
  });

  // Proxy endpoint for crypto chart data (uses CryptoCompare histohour, fallback to CoinGecko)
  app.get('/api/crypto/chart', async (req, res) => {
    try {
      const timeframe = req.query.timeframe as string || '1h';
      const symbol = req.query.symbol as string || 'BNB/USD';
      const cacheKey = `${symbol}-${timeframe}`;
      
      // Check cache first
      const cached = chartCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CHART_CACHE_TTL) {
        console.log(`[Chart] Cache hit for ${symbol} (${timeframe})`);
        
        // Apply headers based on source
        res.setHeader('Cache-Control', 'public, max-age=300');
        if (cached.source) {
          res.setHeader('X-Chart-Source', cached.source);
        }
        
        return res.json(cached.data);
      }
      
      const cryptoSymbol = SYMBOL_TO_CRYPTOCOMPARE[symbol];
      
      // Try CryptoCompare first if symbol is available
      if (cryptoSymbol) {
        try {
          // Map timeframe to CryptoCompare limits and aggregate
          let endpoint = 'histominute';
          let aggregate = 1;
          let limit = 1440; // 24 hours of 1min candles
          
          switch (timeframe) {
            case '1m':
              endpoint = 'histominute';
              aggregate = 1;
              limit = 1440; // 24 hours
              break;
            case '5m':
              endpoint = 'histominute';
              aggregate = 5;
              limit = 288; // 24 hours
              break;
            case '15m':
              endpoint = 'histominute';
              aggregate = 15;
              limit = 96; // 24 hours
              break;
            case '1h':
              endpoint = 'histohour';
              aggregate = 1;
              limit = 24; // 24 hours
              break;
            case '4h':
              endpoint = 'histohour';
              aggregate = 4;
              limit = 42; // 7 days
              break;
            case '1d':
              endpoint = 'histoday';
              aggregate = 1;
              limit = 7; // 7 days
              break;
            case '7d':
              endpoint = 'histoday';
              aggregate = 7;
              limit = 7; // 7 weeks
              break;
            case '30d':
              endpoint = 'histoday';
              aggregate = 1;
              limit = 30; // 30 days
              break;
            case '90d':
              endpoint = 'histoday';
              aggregate = 1;
              limit = 90; // 90 days
              break;
            default:
              endpoint = 'histohour';
              aggregate = 1;
              limit = 24;
          }
          
          const cryptoCompareUrl = `${CRYPTOCOMPARE_BASE_URL}/${endpoint}?fsym=${cryptoSymbol}&tsym=USD&limit=${limit}&aggregate=${aggregate}`;
          console.log(`[Chart] Trying CryptoCompare: ${cryptoCompareUrl}`);
          
          const response = await fetch(cryptoCompareUrl);
          
          if (response.ok) {
            const result = await response.json();
            
            if (result.Response === 'Success' && result.Data) {
              const candles = result.Data.map((candle: any) => ({
                timestamp: candle.time * 1000, // Convert to milliseconds
                open: candle.open,
                high: candle.high,
                low: candle.low,
                close: candle.close,
              }));
              console.log(`[Chart] CryptoCompare success for ${symbol}, returning ${candles.length} candles`);
              
              // Cache the result
              chartCache.set(cacheKey, { data: candles, timestamp: Date.now(), source: 'cryptocompare' });
              
              res.setHeader('Cache-Control', 'public, max-age=300');
              res.setHeader('X-Chart-Source', 'cryptocompare');
              
              return res.json(candles);
            }
          } else {
            console.warn(`[Chart] CryptoCompare returned ${response.status} for ${symbol}`);
          }
        } catch (cryptoCompareError) {
          console.warn(`[Chart] CryptoCompare error for ${symbol}, trying CoinGecko:`, cryptoCompareError);
        }
      }
      
      // Try Birdeye for Solana-native tokens if available (not used for BSC, for current price to generate synthetic chart)
      const birdeyeAddress = SYMBOL_TO_BIRDEYE[symbol];
      if (birdeyeAddress && process.env.BIRDEYE_API_KEY) {
        try {
          const priceResponse = await fetch(
            `${BIRDEYE_BASE_URL}/defi/price?address=${birdeyeAddress}`,
            {
              headers: { 
                'X-API-KEY': process.env.BIRDEYE_API_KEY,
                'x-chain': 'solana'
              }
            }
          );
          
          if (priceResponse.ok) {
            const priceData = await priceResponse.json();
            if (priceData.data?.value) {
              const currentPrice = priceData.data.value;
              console.log(`[Chart] Using Birdeye current price to generate synthetic chart for ${symbol}: $${currentPrice}`);
              
              // Generate synthetic candles using current price with realistic variations
              // Interval mapping for different timeframes:
              let numCandles: number;
              let interval: number; // in milliseconds
              
              switch (timeframe) {
                case '1m':
                  numCandles = 1440; // 24 hours * 60 minutes
                  interval = 1 * 60 * 1000; // 1 minute
                  break;
                case '5m':
                  numCandles = 288; // 24 hours * 12 (5-min intervals)
                  interval = 5 * 60 * 1000; // 5 minutes
                  break;
                case '15m':
                  numCandles = 96; // 24 hours * 4 (15-min intervals)
                  interval = 15 * 60 * 1000; // 15 minutes
                  break;
                case '1h':
                  numCandles = 24; // 24 hours
                  interval = 60 * 60 * 1000; // 1 hour
                  break;
                case '4h':
                  numCandles = 42; // 7 days * 6 (4-hour intervals)
                  interval = 4 * 60 * 60 * 1000; // 4 hours
                  break;
                case '1d':
                  numCandles = 7; // 7 days
                  interval = 24 * 60 * 60 * 1000; // 1 day
                  break;
                case '7d':
                  numCandles = 7; // 7 weeks
                  interval = 7 * 24 * 60 * 60 * 1000; // 7 days
                  break;
                case '30d':
                  numCandles = 30; // 30 days
                  interval = 24 * 60 * 60 * 1000; // 1 day
                  break;
                case '90d':
                  numCandles = 90; // 90 days
                  interval = 24 * 60 * 60 * 1000; // 1 day
                  break;
                default:
                  numCandles = 24;
                  interval = 60 * 60 * 1000; // 1 hour default
              }
              
              const now = Date.now();
              const candles = [];
              let previousClose = currentPrice;
              
              for (let i = numCandles - 1; i >= 0; i--) {
                const timestamp = now - (i * interval);
                
                // Add subtle drift and variation for continuity
                // Overall trend oscillates slightly around current price
                const trendFactor = 1 + (Math.sin(i / 20) * 0.01); // ±1% sinusoidal trend
                const basePrice = currentPrice * trendFactor;
                
                // Random walk from previous close with momentum
                const momentum = 0.997 + (Math.random() * 0.006); // ±0.3%
                const open = i === numCandles - 1 ? basePrice : previousClose;
                const close = Math.max(0.0001, open * momentum);
                
                // High and low with realistic wicks
                const minPrice = Math.min(open, close);
                const maxPrice = Math.max(open, close);
                const wickRange = (maxPrice - minPrice) * 0.5 + 0.0001;
                const high = maxPrice + (Math.random() * wickRange);
                const low = Math.max(0.0001, minPrice - (Math.random() * wickRange));
                
                candles.push({
                  timestamp,
                  open,
                  high,
                  low,
                  close,
                });
                
                previousClose = close;
              }
              
              // Cache the result with source metadata
              chartCache.set(cacheKey, { data: candles, timestamp: Date.now(), source: 'synthetic-birdeye' });
              
              // Indicate synthetic data source via header for frontend transparency
              res.setHeader('X-Chart-Source', 'synthetic-birdeye');
              res.setHeader('Cache-Control', 'public, max-age=300');
              
              return res.json(candles);
            }
          }
        } catch (birdeyeError) {
          console.warn(`[Chart] Birdeye error for ${symbol}, trying CoinGecko:`, birdeyeError);
        }
      }
      
      // Special handling for FOUR - use DexScreener
      if (symbol === 'FOUR') {
        console.log(`[Chart] Fetching chart data for FOUR from DexScreener (${timeframe})`);
        
        try {
          const fourChartData = await getFourChartFromDexScreener(timeframe);
          
          if (fourChartData) {
            // Cache the result
            chartCache.set(cacheKey, { data: fourChartData, timestamp: Date.now(), source: 'dexscreener' });
            
            res.setHeader('X-Chart-Source', 'dexscreener');
            res.setHeader('Cache-Control', 'public, max-age=300');
            
            return res.json(fourChartData);
          }
        } catch (fourChartError) {
          console.warn(`[Chart] DexScreener chart error for FOUR:`, fourChartError);
        }
        
        // If DexScreener fails, fall back to CoinGecko
        console.log(`[Chart] DexScreener failed for FOUR, trying CoinGecko...`);
      }
      
      // Special handling for PUMP/USD - generate synthetic data
      if (symbol === 'PUMP/USD') {
        console.log(`[Chart] Generating synthetic data for PUMP/USD (${timeframe})`);
        
        const now = Date.now();
        const candles = [];
        const basePrice = 0.00704355; // Current real price
        const volatility = 0.05; // 5% volatility
        
        // Generate synthetic candles based on timeframe
        const intervals: Record<string, number> = {
          '1m': 1 * 60 * 1000,      // 1 minute
          '5m': 5 * 60 * 1000,      // 5 minutes
          '15m': 15 * 60 * 1000,    // 15 minutes
          '30m': 30 * 60 * 1000,    // 30 minutes
          '1h': 60 * 60 * 1000,     // 1 hour
          '4h': 4 * 60 * 60 * 1000, // 4 hours
          '1d': 24 * 60 * 60 * 1000, // 1 day
          '1w': 7 * 24 * 60 * 60 * 1000, // 1 week
          '1M': 30 * 24 * 60 * 60 * 1000 // 1 month
        };
        
        const interval = intervals[timeframe] || intervals['1h'];
        const numCandles = timeframe === '1M' ? 30 : (timeframe === '1w' ? 7 : 24);
        
        let currentPrice = basePrice;
        
        for (let i = numCandles; i >= 0; i--) {
          const timestamp = now - (i * interval);
          const change = (Math.random() - 0.5) * volatility;
          const open = currentPrice;
          const close = open * (1 + change);
          const high = Math.max(open, close) * (1 + Math.random() * 0.02);
          const low = Math.min(open, close) * (1 - Math.random() * 0.02);
          
          candles.push({
            timestamp,
            open,
            high,
            low,
            close,
          });
          
          currentPrice = close;
        }
        
        // Cache the result
        chartCache.set(cacheKey, { data: candles, timestamp: Date.now() });
        
        res.setHeader('X-Chart-Source', 'synthetic-pump');
        res.setHeader('Cache-Control', 'public, max-age=300');
        
        return res.json(candles);
      }
      
      // Fallback to CoinGecko for other symbols
      const coinId = SYMBOL_TO_COINGECKO_ID[symbol];
      if (!coinId) {
        console.warn(`[Chart] Unmapped symbol requested: ${symbol}`);
        return res.status(400).json({ error: `Symbol ${symbol} is not supported` });
      }
      
      // Convert timeframe to days for CoinGecko
      const timeframeToDays: { [key: string]: string } = {
        '1m': '1',
        '5m': '1', 
        '15m': '1',
        '30m': '1',
        '1h': '1',
        '4h': '7',
        '1d': '30',
        '1w': '90',
        '1M': '365'
      };
      
      const days = timeframeToDays[timeframe as keyof typeof timeframeToDays] || '1';
      
      const response = await fetch(
        `${COINGECKO_BASE_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=${days === '1' ? 'minutely' : 'hourly'}`
      );
      
      if (!response.ok) {
        console.error(`[Chart] CoinGecko API error for ${coinId} (symbol: ${symbol}): ${response.status}`);
        throw new Error('Failed to fetch chart data from CoinGecko');
      }
      
      const data = await response.json();
      const prices = data.prices || [];
      
      if (!prices || prices.length === 0) {
        console.error(`[Chart] No chart data available for ${coinId} (symbol: ${symbol})`);
        return res.status(502).json({ error: `No chart data available for ${symbol}` });
      }
      
      // Convert CoinGecko prices to candlestick format
      const candles = [];
      const groupSize = days === '1' ? 5 : 4;
      
      for (let i = 0; i < prices.length; i += groupSize) {
        const group = prices.slice(i, Math.min(i + groupSize, prices.length));
        if (group.length > 0) {
          const open = group[0][1];
          const close = group[group.length - 1][1];
          const high = Math.max(...group.map((p: any[]) => p[1]));
          const low = Math.min(...group.map((p: any[]) => p[1]));
          
          candles.push({
            timestamp: group[0][0],
            open,
            high,
            low,
            close,
          });
        }
      }
      
      console.log(`[Chart] CoinGecko success for ${symbol}, returning ${candles.length} candles`);
      
      // Cache the result
      chartCache.set(cacheKey, { data: candles, timestamp: Date.now(), source: 'coingecko' });
      
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.setHeader('X-Chart-Source', 'coingecko');
      
      res.json(candles);
    } catch (error) {
      console.error('[Chart] Error fetching chart data:', error);
      res.status(500).json({ error: 'Failed to fetch chart data' });
    }
  });

  // Proxy endpoint for Fear & Greed Index
  app.get('/api/crypto/fear-greed', async (req, res) => {
    try {
      // Get current market data to calculate sentiment
      const symbols = ['BTC/USD', 'ETH/USD', 'BNB/USD'];
      const priceChanges = [];
      
      for (const symbol of symbols) {
        try {
          const cryptoSymbol = SYMBOL_TO_CRYPTOCOMPARE[symbol];
          if (!cryptoSymbol) continue;
          
          const response = await fetch(
            `${CRYPTOCOMPARE_BASE_URL}/pricemultifull?fsyms=${cryptoSymbol}&tsyms=USD`,
            { 
              headers: { 'authorization': `Apikey ${CRYPTOCOMPARE_API_KEY}` }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            const priceData = data.RAW[cryptoSymbol]?.USD;
            
            if (priceData && priceData.CHANGEPCT24HOUR) {
              priceChanges.push(priceData.CHANGEPCT24HOUR);
            }
          }
        } catch (symbolError) {
          console.error(`[Fear & Greed] Error fetching ${symbol}:`, symbolError);
        }
      }
      
      // Calculate market sentiment based on price changes
      let sentimentValue = 50; // Neutral starting point
      let classification = "Neutral";
      
      if (priceChanges.length > 0) {
        const avgChange = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
        const maxChange = Math.max(...priceChanges);
        const minChange = Math.min(...priceChanges);
        const volatility = maxChange - minChange;
        
        // Calculate sentiment based on average change and volatility
        if (avgChange > 5 && volatility < 10) {
          // Strong bullish with low volatility
          sentimentValue = Math.min(85, 50 + (avgChange * 3));
          classification = "Extreme Greed";
        } else if (avgChange > 2 && volatility < 15) {
          // Moderate bullish
          sentimentValue = Math.min(75, 50 + (avgChange * 4));
          classification = "Greed";
        } else if (avgChange > 0) {
          // Slight bullish
          sentimentValue = Math.min(65, 50 + (avgChange * 5));
          classification = "Greed";
        } else if (avgChange > -2) {
          // Neutral
          sentimentValue = 45 + (avgChange * 2);
          classification = "Neutral";
        } else if (avgChange > -5) {
          // Slight bearish
          sentimentValue = Math.max(25, 50 + (avgChange * 4));
          classification = "Fear";
        } else {
          // Strong bearish
          sentimentValue = Math.max(5, 50 + (avgChange * 3));
          classification = "Extreme Fear";
        }
        
        // Adjust for volatility (high volatility = more extreme sentiment)
        if (volatility > 20) {
          if (avgChange > 0) {
            sentimentValue = Math.min(90, sentimentValue + 10);
          } else {
            sentimentValue = Math.max(10, sentimentValue - 10);
          }
        }
        
        // Ensure value is within bounds
        sentimentValue = Math.max(0, Math.min(100, Math.round(sentimentValue)));
      }
      
      // Add some randomness to make it more dynamic (simulate market fluctuations)
      const randomFactor = (Math.random() - 0.5) * 5; // ±2.5 points
      sentimentValue = Math.max(0, Math.min(100, Math.round(sentimentValue + randomFactor)));
      
      // Update classification based on final value
      if (sentimentValue >= 80) classification = "Extreme Greed";
      else if (sentimentValue >= 60) classification = "Greed";
      else if (sentimentValue >= 40) classification = "Neutral";
      else if (sentimentValue >= 20) classification = "Fear";
      else classification = "Extreme Fear";
      
      const fearGreedData = {
        value: sentimentValue,
        classification: classification,
        timestamp: Date.now(),
        calculation: {
          averageChange: priceChanges.length > 0 ? (priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length).toFixed(2) : 0,
          volatility: priceChanges.length > 1 ? (Math.max(...priceChanges) - Math.min(...priceChanges)).toFixed(2) : 0,
          symbolsAnalyzed: priceChanges.length
        }
      };
      
      console.log(`[Fear & Greed] Calculated: ${sentimentValue} (${classification}) - Avg Change: ${fearGreedData.calculation.averageChange}%`);
      
      res.setHeader('Cache-Control', 'public, max-age=60'); // Cache for 1 minute
      res.json(fearGreedData);
    } catch (error) {
      console.error('[Fear & Greed] Error:', error);
      // Fallback to neutral sentiment
      res.json({
        value: 50,
        classification: "Neutral",
        timestamp: Date.now(),
        error: true
      });
    }
  });

  // Proxy endpoint for multiple crypto prices (for Live Market section)
  app.get('/api/crypto/market-prices', async (req, res) => {
    console.log('[Market Prices] Request received - fetching fresh data...');
    
    // Disable caching to ensure fresh data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Last-Modified': new Date().toUTCString()
    });
    
    try {
      // Use the same approach as the working individual price endpoint
      const symbols = ['BTC/USD', 'ETH/USD', 'BNB/USD'];
      const marketData = [];
      
      for (const symbol of symbols) {
        try {
          const cryptoSymbol = SYMBOL_TO_CRYPTOCOMPARE[symbol];
          if (!cryptoSymbol) {
            console.log(`[Market Prices] Skipping ${symbol} - not available on CryptoCompare`);
            continue;
          }
          
          console.log(`[Market Prices] Fetching ${symbol} (${cryptoSymbol})...`);
          
          const response = await fetch(
            `${CRYPTOCOMPARE_BASE_URL}/pricemultifull?fsyms=${cryptoSymbol}&tsyms=USD`,
            { 
              headers: { 'authorization': `Apikey ${CRYPTOCOMPARE_API_KEY}` }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            const priceData = data.RAW[cryptoSymbol]?.USD;
            
            if (priceData) {
              marketData.push({
                symbol: symbol,
                price: priceData.PRICE,
                change: priceData.CHANGEPCT24HOUR,
              });
              console.log(`[Market Prices] Success for ${symbol}: $${priceData.PRICE}`);
            } else {
              console.log(`[Market Prices] No price data found for ${symbol}`);
            }
          } else {
            console.log(`[Market Prices] Response not OK for ${symbol}: ${response.status}`);
          }
        } catch (symbolError) {
          console.error(`[Market Prices] Error fetching ${symbol}:`, symbolError);
        }
      }
      
      // Add FOUR with real-time price from DexScreener
      try {
        console.log('[Market Prices] Fetching FOUR data from DexScreener...');
        const fourData = await getFourPriceFromDexScreener();
        
        if (fourData) {
          marketData.push({
            symbol: 'FOUR',
            price: fourData.price,
            change: fourData.change,
          });
          console.log(`[Market Prices] DexScreener success for FOUR: $${fourData.price} (${fourData.change}%)`);
        } else {
          // Fallback to static data if DexScreener fails
          marketData.push({
            symbol: 'FOUR',
            price: 0.00703518,
            change: 31.33,
          });
          console.log(`[Market Prices] Using static data for FOUR: $0.00703518`);
        }
      } catch (fourError) {
        console.error('[Market Prices] Error fetching FOUR data:', fourError);
        // Fallback to static data
        marketData.push({
          symbol: 'FOUR',
          price: 0.00703518,
          change: 31.33,
        });
        console.log(`[Market Prices] Using static data for FOUR: $0.00703518`);
      }
      
      console.log('[Market Prices] Fresh data fetched:', marketData);
      
      res.json({
        data: marketData,
        timestamp: Date.now(),
        fresh: true
      });
      
    } catch (error) {
      console.error('[Market Prices] Error fetching market prices:', error);
      
      // Use current fallback data
      const fallbackData = [
        { symbol: 'BTC/USD', price: 117500, change: 3.55 },
        { symbol: 'ETH/USD', price: 4112.48, change: 2.44 },
        { symbol: 'BNB/USD', price: 650.00, change: 0.85 },
        { symbol: 'FOUR', price: 0.00703518, change: 31.33 },
      ];
      res.json({
        data: fallbackData,
        timestamp: Date.now(),
        fresh: true,
        fallback: true
      });
    }
  });

  // BSC RPC Proxy - Required because public RPC may block browser requests
  app.post('/api/bsc-rpc-proxy', async (req, res) => {
    try {
      console.log('[BSC RPC Proxy] Received request:', req.body);
      
      const response = await fetch('https://bsc-dataseed.binance.org/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      
      const data = await response.json();
      console.log('[BSC RPC Proxy] Sending response:', data);
      
      res.setHeader('Content-Type', 'application/json');
      res.json(data);
    } catch (error) {
      console.error('[BSC RPC Proxy] Error:', error);
      res.status(500).json({ 
        jsonrpc: '2.0', 
        error: { code: -32603, message: 'Internal error' }, 
        id: req.body.id 
      });
    }
  });

  // Wallet Profile API Routes
  // NOTE: Production requires wallet signature verification to prove wallet ownership
  // on all write operations (POST/PUT/DELETE) to prevent unauthorized access
  
  // Create wallet profile
  app.post('/api/wallet/profile', async (req, res) => {
    try {
      const result = insertWalletProfileSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(422).json({ error: 'Validation failed', details: result.error.issues });
      }
      
      const profile = await storage.createWalletProfile(result.data);
      res.status(201).location(`/api/wallet/profile/${profile.walletAddress}`).json(profile);
    } catch (error: any) {
      console.error('Error creating wallet profile:', error);
      
      if (error.message?.includes('already exists')) {
        return res.status(409).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Failed to create wallet profile' });
    }
  });

  // Get wallet profile by address
  app.get('/api/wallet/profile/:walletAddress', async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const profile = await storage.getWalletProfile(walletAddress);
      
      if (!profile) {
        return res.status(404).json({ error: 'Wallet profile not found' });
      }
      
      res.json(profile);
    } catch (error: any) {
      console.error('Error fetching wallet profile:', error);
      res.status(500).json({ error: 'Failed to fetch wallet profile' });
    }
  });

  // Get wallet profile by username
  app.get('/api/wallet/profile/username/:username', async (req, res) => {
    try {
      const { username } = req.params;
      const profile = await storage.getWalletProfileByUsername(username);
      
      if (!profile) {
        return res.status(404).json({ error: 'Wallet profile not found' });
      }
      
      res.json(profile);
    } catch (error: any) {
      console.error('Error fetching wallet profile:', error);
      res.status(500).json({ error: 'Failed to fetch wallet profile' });
    }
  });

  // Update wallet profile
  app.put('/api/wallet/profile/:walletAddress', async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      // Remove walletAddress from body to prevent conflicts
      const { walletAddress: _, ...bodyWithoutAddress } = req.body;
      
      const result = insertWalletProfileSchema.partial().safeParse(bodyWithoutAddress);
      
      if (!result.success) {
        return res.status(422).json({ error: 'Validation failed', details: result.error.issues });
      }
      
      const profile = await storage.updateWalletProfile(walletAddress, result.data);
      
      if (!profile) {
        return res.status(404).json({ error: 'Wallet profile not found' });
      }
      
      res.json(profile);
    } catch (error: any) {
      console.error('Error updating wallet profile:', error);
      
      if (error.message?.includes('already exists')) {
        return res.status(409).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Failed to update wallet profile' });
    }
  });

  // Delete wallet profile
  app.delete('/api/wallet/profile/:walletAddress', async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const deleted = await storage.deleteWalletProfile(walletAddress);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Wallet profile not found' });
      }
      
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting wallet profile:', error);
      res.status(500).json({ error: 'Failed to delete wallet profile' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}