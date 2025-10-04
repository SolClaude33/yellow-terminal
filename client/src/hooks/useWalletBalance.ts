import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRealTimePrice } from '@/lib/cryptoApi';

// Using direct BSC RPC calls with fallback to proxy
const BSC_RPC_ENDPOINTS = [
  'https://bsc-dataseed.binance.org/',
  'https://bsc-dataseed1.defibit.io/',
  'https://bsc-dataseed1.ninicoin.io/',
  '/api/bsc-rpc-proxy', // Fallback to our proxy
  '/api/test/wallet-balance' // Final fallback to our test endpoint
];
const WEI_PER_BNB = BigInt(10 ** 18);

interface PriceData {
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
}

interface WalletBalanceData {
  bnb: number;
  usd: number;
  isLoading: boolean;
  error: Error | null;
  priceError: boolean;
  priceData?: PriceData;
}

export function useWalletBalance(walletAddress: string | null): WalletBalanceData {
  const [bnb, setBnb] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const { data: priceData, isLoading: isPriceLoading, error: priceError } = useQuery<PriceData>({
    queryKey: ['/api/crypto/price', 'BNB/USD'],
    queryFn: () => getRealTimePrice('BNB/USD'),
    refetchInterval: 30000, // Reduced frequency
    staleTime: 20000,
    gcTime: 60000,
  });

  useEffect(() => {
    if (!walletAddress) {
      setBnb(0);
      setError(null);
      return;
    }

    let isMounted = true;

    const fetchBalance = async () => {
      try {
        setIsLoadingBalance(true);
        setError(null);
        
        const rpcRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBalance',
          params: [walletAddress, 'latest'],
        };

        let lastError: Error | null = null;
        
        // Try each endpoint until one works
        for (const endpoint of BSC_RPC_ENDPOINTS) {
          try {
            console.log(`[useWalletBalance] Trying endpoint: ${endpoint}`);
            
            let response;
            let data;
            
            if (endpoint === '/api/test/wallet-balance') {
              // Special handling for our test endpoint
              response = await fetch(endpoint, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ walletAddress }),
              });
              
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              data = await response.json();
              
              if (data.status === 'error') {
                throw new Error(data.message || 'Failed to fetch balance');
              }
              
              const bnbBalance = data.balance;
              console.log(`[useWalletBalance] Success with ${endpoint}: ${bnbBalance} BNB`);
              
              if (isMounted) {
                setBnb(bnbBalance);
                setError(null);
              }
              return; // Success, exit the function
              
            } else {
              // Standard RPC endpoints
              response = await fetch(endpoint, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                body: JSON.stringify(rpcRequest),
              });

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              data = await response.json();
              
              if (data.error) {
                throw new Error(data.error.message || 'Failed to fetch balance');
              }

              const balanceWei = BigInt(data.result || '0x0');
              const bnbBalance = Number(balanceWei) / Number(WEI_PER_BNB);
              
              console.log(`[useWalletBalance] Success with ${endpoint}: ${bnbBalance} BNB`);
              
              if (isMounted) {
                setBnb(bnbBalance);
                setError(null);
              }
              return; // Success, exit the function
            }
            
          } catch (err) {
            console.error(`[useWalletBalance] Failed with ${endpoint}:`, err);
            lastError = err as Error;
            continue; // Try next endpoint
          }
        }
        
        // If we get here, all endpoints failed
        throw lastError || new Error('All BSC RPC endpoints failed');
        
      } catch (err) {
        console.error('[useWalletBalance] All endpoints failed:', err);
        if (isMounted) {
          setError(err as Error);
          setBnb(0);
        }
      } finally {
        if (isMounted) {
          setIsLoadingBalance(false);
        }
      }
    };

    fetchBalance();

    const intervalId = window.setInterval(fetchBalance, 60000); // Reduced from 30s to 60s

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [walletAddress]);

  const usd = useMemo(() => {
    const bnbPrice = priceData?.current_price;
    console.log(`[useWalletBalance] USD calculation - BNB: ${bnb}, Price: ${bnbPrice}, PriceError: ${priceError}`);
    if (!bnbPrice || priceError) {
      console.log(`[useWalletBalance] USD calculation failed - no price data or error`);
      return 0;
    }
    const calculatedUsd = bnb * bnbPrice;
    console.log(`[useWalletBalance] USD calculated: ${calculatedUsd} (${bnb} BNB * $${bnbPrice})`);
    return calculatedUsd;
  }, [bnb, priceData, priceError]);

  return {
    bnb,
    usd,
    isLoading: isLoadingBalance || isPriceLoading,
    error,
    priceError: !!priceError,
    priceData, // Export price data for P&L calculation
  };
}
