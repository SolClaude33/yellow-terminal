import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

// Using backend proxy to bypass CORS restrictions
const BSC_RPC_ENDPOINT = '/api/bsc-rpc-proxy';
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
}

export function useWalletBalance(walletAddress: string | null): WalletBalanceData {
  const [bnb, setBnb] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const { data: priceData, isLoading: isPriceLoading, error: priceError } = useQuery<PriceData>({
    queryKey: ['/api/crypto/price'],
    refetchInterval: 10000,
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
        
        const response = await fetch(BSC_RPC_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getBalance',
            params: [walletAddress, 'latest'],
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error.message || 'Failed to fetch balance');
        }

        const balanceWei = BigInt(data.result || '0x0');
        const bnbBalance = Number(balanceWei) / Number(WEI_PER_BNB);
        
        if (isMounted) {
          setBnb(bnbBalance);
        }
      } catch (err) {
        console.error('[useWalletBalance] Error fetching balance:', err);
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

    const intervalId = window.setInterval(fetchBalance, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [walletAddress]);

  const usd = useMemo(() => {
    const bnbPrice = priceData?.current_price;
    if (!bnbPrice || priceError) return 0;
    return bnb * bnbPrice;
  }, [bnb, priceData, priceError]);

  return {
    bnb,
    usd,
    isLoading: isLoadingBalance || isPriceLoading,
    error,
    priceError: !!priceError,
  };
}
