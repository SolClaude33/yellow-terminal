import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { CandlestickController, CandlestickElement, OhlcController, OhlcElement } from 'chartjs-chart-financial';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';
import { getRealTimeCandles, type CandlestickData } from '@/lib/cryptoApi';
import { useTradingSymbol } from '@/contexts/TradingSymbolContext';
import { Loader2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

ChartJS.register(
  TimeScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  CandlestickController,
  CandlestickElement,
  OhlcController,
  OhlcElement,
  zoomPlugin
);

export default function CandlestickChart() {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<ChartJS | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const { selectedSymbol } = useTradingSymbol();

  const { data: candleData, isLoading, error } = useQuery({
    queryKey: ['real-time-candles', selectedTimeframe, selectedSymbol],
    queryFn: () => getRealTimeCandles(selectedTimeframe, selectedSymbol),
    refetchInterval: selectedTimeframe === '1m' ? 5000 : // 5 seconds for 1m
                     selectedTimeframe === '5m' ? 10000 : // 10 seconds for 5m
                     selectedTimeframe === '15m' ? 15000 : // 15 seconds for 15m
                     selectedTimeframe === '1h' ? 30000 : // 30 seconds for 1h
                     selectedTimeframe === '4h' ? 60000 : // 1 minute for 4h
                     120000, // 2 minutes for daily+ timeframes
  });

  useEffect(() => {
    if (!chartRef.current || !candleData) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const chartData = candleData.map((candle: CandlestickData) => ({
      x: candle.timestamp,
      o: candle.open,
      h: candle.high,
      l: candle.low,
      c: candle.close,
    }));

    const options: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 750,
        easing: 'easeInOutQuart',
      },
      transitions: {
        show: {
          animations: {
            x: {
              from: 0
            },
            y: {
              from: 0
            }
          }
        },
        hide: {
          animations: {
            x: {
              to: 0
            },
            y: {
              to: 0
            }
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: selectedTimeframe === '1m' ? 'minute' :
                  selectedTimeframe === '5m' || selectedTimeframe === '15m' ? 'minute' :
                  selectedTimeframe === '1h' || selectedTimeframe === '4h' ? 'hour' : 'day',
          },
          grid: {
            color: 'rgba(0, 212, 255, 0.08)',
            lineWidth: 1,
          },
          border: {
            display: false,
          },
          ticks: {
            color: '#00d4ff',
            font: {
              family: 'Roboto Mono',
              size: 11,
            },
            padding: 8,
            maxTicksLimit: 8,
          },
        },
        y: {
          type: 'linear',
          position: 'right',
          grid: {
            color: 'rgba(0, 212, 255, 0.08)',
            lineWidth: 1,
          },
          border: {
            display: false,
          },
          ticks: {
            color: '#00d4ff',
            font: {
              family: 'Roboto Mono',
              size: 11,
            },
            padding: 8,
            callback: function(value: any) {
              return '$' + value.toFixed(2);
            },
            maxTicksLimit: 8,
          },
        },
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
      elements: {
        point: {
          radius: 0,
          hoverRadius: 6,
          hoverBorderWidth: 2,
          hoverBorderColor: '#00d4ff',
          hoverBackgroundColor: 'rgba(0, 212, 255, 0.2)',
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: `${selectedSymbol} Candlestick Chart`,
          color: '#00d4ff',
          font: {
            family: 'Orbitron',
            size: 16,
          },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(5, 5, 15, 0.95)',
          titleColor: '#00d4ff',
          bodyColor: '#ffffff',
          borderColor: '#00d4ff',
          borderWidth: 2,
          cornerRadius: 8,
          padding: 12,
          titleFont: {
            family: 'Orbitron',
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            family: 'Roboto Mono',
            size: 12
          },
          callbacks: {
            title: function(context: any) {
              const date = new Date(context[0].parsed.x);
              return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              });
            },
            label: function(context: any) {
              const data = context.parsed;
              const change = data.c - data.o;
              const changePercent = ((change / data.o) * 100).toFixed(2);
              const changeColor = change >= 0 ? '#00ff88' : '#ff4444';
              
              return [
                `Open: $${data.o.toFixed(2)}`,
                `High: $${data.h.toFixed(2)}`,
                `Low: $${data.l.toFixed(2)}`,
                `Close: $${data.c.toFixed(2)}`,
                `Change: ${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent}%)`
              ];
            },
            labelColor: function(context: any) {
              const data = context.parsed;
              const change = data.c - data.o;
              return {
                borderColor: change >= 0 ? '#00ff88' : '#ff4444',
                backgroundColor: change >= 0 ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 68, 68, 0.1)',
                borderWidth: 1,
                borderDash: [0, 0],
                borderRadius: 4
              };
            }
          }
        },
        zoom: {
          zoom: {
            wheel: {
              enabled: true,
              speed: 0.1,
            },
            pinch: {
              enabled: true,
            },
            mode: 'x',
          },
          pan: {
            enabled: true,
            mode: 'x',
            modifierKey: 'ctrl', // Use Ctrl key for panning
          },
          limits: {
            x: {
              min: 'original',
              max: 'original',
            },
          },
        },
      },
    };

    chartInstanceRef.current = new ChartJS(ctx, {
      type: 'candlestick',
      data: {
      datasets: [{
        label: selectedSymbol,
        data: chartData,
        borderColor: (ctx: any) => {
          const data = ctx.parsed;
          return data.c >= data.o ? '#00ff88' : '#ff4444';
        },
        backgroundColor: (ctx: any) => {
          const data = ctx.parsed;
          return data.c >= data.o ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 68, 68, 0.1)';
        },
        borderWidth: 1.5,
        borderRadius: 2,
      }],
      },
      options,
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [candleData, selectedTimeframe, selectedSymbol]);

  const handleZoomIn = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.zoom(1.1);
    }
  };

  const handleZoomOut = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.zoom(0.9);
    }
  };

  const handleResetZoom = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.resetZoom();
    }
  };

  const timeframes = [
    { label: '1m', value: '1m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '1h', value: '1h' },
    { label: '4h', value: '4h' },
    { label: '1D', value: '1D' },
    { label: '7D', value: '7D' },
    { label: '30D', value: '30D' },
    { label: '90D', value: '90D' },
  ];

  if (error) {
    return (
      <div className="bg-card/30 cyber-border rounded-lg p-6 flex items-center justify-center" style={{ height: '400px' }}>
        <div className="text-center">
          <p className="text-cyber-danger font-mono">Error loading {selectedSymbol} chart data</p>
          <p className="text-sm text-muted-foreground mt-2">Please try again or select another symbol</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeframe Selector */}
      <div className="flex justify-center flex-wrap gap-2">
        {timeframes.map((tf) => (
          <button
            key={tf.value}
            onClick={() => setSelectedTimeframe(tf.value)}
            className={`px-3 py-1 text-xs font-mono rounded cyber-border transition-all ${
              selectedTimeframe === tf.value
                ? 'bg-primary text-primary-foreground cyber-glow'
                : 'bg-card hover:bg-card/80'
            }`}
            data-testid={`timeframe-${tf.label.toLowerCase()}`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Zoom Controls */}
      <div className="flex justify-center gap-2">
        <button
          onClick={handleZoomIn}
          className="px-3 py-1 text-xs font-mono rounded cyber-border bg-card hover:bg-card/80 transition-all flex items-center gap-1"
          title="Zoom In"
        >
          <ZoomIn className="w-3 h-3" />
          Zoom In
        </button>
        <button
          onClick={handleZoomOut}
          className="px-3 py-1 text-xs font-mono rounded cyber-border bg-card hover:bg-card/80 transition-all flex items-center gap-1"
          title="Zoom Out"
        >
          <ZoomOut className="w-3 h-3" />
          Zoom Out
        </button>
        <button
          onClick={handleResetZoom}
          className="px-3 py-1 text-xs font-mono rounded cyber-border bg-card hover:bg-card/80 transition-all flex items-center gap-1"
          title="Reset Zoom"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Chart Instructions */}
      <div className="flex justify-center items-center gap-6 text-xs text-muted-foreground font-mono">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <span>Mouse wheel: Zoom</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-secondary rounded-full"></div>
          <span>Click & drag: Pan</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-accent rounded-full"></div>
          <span>Buttons: Precise control</span>
        </div>
      </div>

      {/* Chart Container */}
      <div className="bg-card/30 cyber-border rounded-lg p-4 relative" style={{ height: '400px' }}>
        {/* Price Indicator */}
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm font-mono text-muted-foreground">
                Loading {selectedSymbol} data...
              </p>
            </div>
          </div>
        ) : (
          <canvas
            ref={chartRef}
            data-testid="crypto-chart"
            className="w-full h-full"
          />
        )}
      </div>
    </div>
  );
}