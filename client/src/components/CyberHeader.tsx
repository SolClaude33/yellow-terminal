import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CyberHeader() {
  const [glitch, setGlitch] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Contract Address - Update this when available
  const contractAddress = "0x0000000000000000000000000000000000000000"; // Placeholder - Update with real address
  const isAddressAvailable = !contractAddress.startsWith("0x0000000000");

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 500);
    }, 5000);

    return () => clearInterval(glitchInterval);
  }, []);

  const copyToClipboard = async () => {
    if (!isAddressAvailable) return;
    
    try {
      await navigator.clipboard.writeText(contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <header className="bg-card cyber-border p-4 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-2xl font-cyber cyber-glow">
            ╔═══════════════════════════════════════════════════════╗
          </div>
        </div>
        <div className="text-center flex-1">
          <h1 className={`text-4xl font-cyber cyber-glow ${glitch ? 'glitch' : ''}`}>
            <span className="text-cyber-purple">暗池</span> <span className="text-muted-foreground/50">|</span> Dark Pool
          </h1>
          <div className="text-sm text-muted-foreground mt-1">
            [DARK POOL v3.0.0 - STATUS: ONLINE]
          </div>
          
          {/* Contract Address - Compact inline display */}
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-[10px] font-mono text-cyber-gold/70 uppercase tracking-wider">CA:</span>
            <div className="group relative inline-flex items-center gap-1.5 bg-cyber-gold/5 border border-cyber-gold/20 rounded px-3 py-1 hover:border-cyber-gold/40 transition-all">
              <code 
                className={`text-[11px] font-mono max-w-[300px] truncate ${isAddressAvailable ? 'text-foreground/90' : 'text-muted-foreground/60 italic'}`}
                title={isAddressAvailable ? contractAddress : "Contract Address - To Be Announced"}
              >
                {isAddressAvailable ? contractAddress : "To Be Announced"}
              </code>
              {isAddressAvailable && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0 hover:bg-cyber-gold/20 opacity-70 hover:opacity-100 transition-opacity"
                  onClick={copyToClipboard}
                  title="Copy contract address"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-cyber-success" />
                  ) : (
                    <Copy className="h-3 w-3 text-cyber-gold" />
                  )}
                </Button>
              )}
              {/* Tooltip on hover showing full address */}
              {isAddressAvailable && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-black/95 border border-cyber-gold/40 rounded text-[10px] font-mono text-cyber-gold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {contractAddress}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="text-2xl font-cyber cyber-glow">
          ╚═══════════════════════════════════════════════════════╝
        </div>
      </div>
    </header>
  );
}