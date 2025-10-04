import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMarketPrices } from '@/lib/cryptoApi';

interface MarketSentimentData {
  value: number; // 0-100 score
  classification: string;
  description: string;
  timestamp: number;
  isLoading: boolean;
  error: Error | null;
}

export function useMarketSentiment(): MarketSentimentData {
  const { data: marketPrices, isLoading, error } = useQuery({
    queryKey: ['market-prices'],
    queryFn: getMarketPrices,
    refetchInterval: 30000, // 30 seconds
    staleTime: 20000,
    gcTime: 60000,
  });

  const sentimentData = useMemo(() => {
    if (!marketPrices || marketPrices.length === 0) {
      return {
        value: 50,
        classification: 'Neutral',
        description: 'Insufficient data to calculate sentiment',
        timestamp: Date.now(),
      };
    }

    // Calculate weighted sentiment based on market cap importance
    // BTC (40%), ETH (30%), BNB (20%), FOUR (10%)
    const weights = {
      'BTC/USD': 0.4,
      'ETH/USD': 0.3,
      'BNB/USD': 0.2,
      'FOUR': 0.1,
    };

    let weightedSum = 0;
    let totalWeight = 0;

    marketPrices.forEach((ticker) => {
      const weight = weights[ticker.symbol as keyof typeof weights] || 0;
      if (weight > 0) {
        // Convert 24h change to sentiment score (0-100)
        // Negative change = lower sentiment, positive change = higher sentiment
        const change = ticker.change;
        const sentimentScore = Math.max(0, Math.min(100, 50 + change));
        
        weightedSum += sentimentScore * weight;
        totalWeight += weight;
      }
    });

    if (totalWeight === 0) {
      return {
        value: 50,
        classification: 'Neutral',
        description: 'No valid market data available',
        timestamp: Date.now(),
      };
    }

    const finalScore = Math.round(weightedSum / totalWeight);

    // Determine classification and description
    let classification: string;
    let description: string;

    if (finalScore >= 80) {
      classification = 'Extreme Greed';
      description = 'Market is extremely bullish - caution advised';
    } else if (finalScore >= 65) {
      classification = 'Greed';
      description = 'Strong bullish sentiment across major assets';
    } else if (finalScore >= 55) {
      classification = 'Optimistic';
      description = 'Positive sentiment with moderate optimism';
    } else if (finalScore >= 45) {
      classification = 'Neutral';
      description = 'Balanced market sentiment';
    } else if (finalScore >= 35) {
      classification = 'Cautious';
      description = 'Negative sentiment with some concern';
    } else if (finalScore >= 20) {
      classification = 'Fear';
      description = 'Strong bearish sentiment across markets';
    } else {
      classification = 'Extreme Fear';
      description = 'Market panic - potential buying opportunity';
    }

    return {
      value: finalScore,
      classification,
      description,
      timestamp: Date.now(),
    };
  }, [marketPrices]);

  return {
    ...sentimentData,
    isLoading,
    error: error as Error | null,
  };
}
