import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

const BSC_RPC_ENDPOINT = '/api/bsc-rpc-proxy';
const BNB_ADDRESS = 'BNB';
const WEI_PER_BNB = BigInt(10 ** 18);

interface TokenHolding {
  mint: string;
  symbol: string;
  balance: number;
  decimals: number;
  usdValue: number;
}

interface PortfolioAnalysis {
  topHoldings: TokenHolding[];
  isLoading: boolean;
  error: Error | null;
}

interface PriceData {
  current_price: number;
}

export function usePortfolioAnalyzer(walletAddress: string | null): PortfolioAnalysis {
  const [topHoldings, setTopHoldings] = useState<TokenHolding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { data: bnbPrice } = useQuery<PriceData>({
    queryKey: ['/api/crypto/price'],
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!walletAddress) {
      setTopHoldings([]);
      setError(null);
      return;
    }

    let isMounted = true;
    let abortController = new AbortController();

    const fetchPortfolio = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const balanceRes = await fetch(BSC_RPC_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getBalance',
            params: [walletAddress, 'latest'],
          }),
          signal: abortController.signal,
        });

        const balanceData = await balanceRes.json();

        const balanceWei = BigInt(balanceData.result || '0x0');
        const bnbBalance = Number(balanceWei) / Number(WEI_PER_BNB);
        
        const holdings: TokenHolding[] = [];

        if (bnbBalance > 0 && bnbPrice?.current_price) {
          holdings.push({
            mint: BNB_ADDRESS,
            symbol: 'BNB',
            balance: bnbBalance,
            decimals: 18,
            usdValue: bnbBalance * bnbPrice.current_price,
          });
        }

        if (isMounted) {
          setTopHoldings(holdings);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        if (isMounted) {
          setError(err as Error);
          setTopHoldings([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPortfolio();

    const intervalId = window.setInterval(() => {
      abortController.abort();
      abortController = new AbortController();
      fetchPortfolio();
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      abortController.abort();
    };
  }, [walletAddress, bnbPrice]);

  return {
    topHoldings,
    isLoading,
    error,
  };
}
