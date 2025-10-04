import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Trophy, MessageSquare, Wallet, User, LogOut, Loader2 } from "lucide-react";
// import cyberAvatar from "@assets/generated_images/Cyberpunk_trader_avatar_9c40e50f.png";
import { useWallet } from "@/hooks/useWallet";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { usePortfolioAnalyzer } from "@/hooks/usePortfolioAnalyzer";
import { usePnLCalculator } from "@/hooks/usePnLCalculator";
import { useWalletProfile } from "@/hooks/useWalletProfile";
import { UsernameDialog } from "./UsernameDialog";

export default function RightSidebar() {
  const { walletAddress, connected, connecting, connect, disconnect } = useWallet();
  const { bnb, usd, isLoading: balanceLoading, priceData } = useWalletBalance(walletAddress);
  const { topHoldings, isLoading: portfolioLoading } = usePortfolioAnalyzer(walletAddress);
  const { pnlAmount, pnlPercentage, isLoading: pnlLoading } = usePnLCalculator(topHoldings);
  const { profile, hasProfile, needsProfile, isLoading: profileLoading, error: profileError } = useWalletProfile(walletAddress);

  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [dismissedAutoPrompt, setDismissedAutoPrompt] = useState<string | null>(null);

  const showTopTradersPlaceholder = true;

  const [socialFeed] = useState([
    { id: 1, user: 'CryptoGuru', message: 'Major bullish breakout incoming! 🚀', time: '2m' },
    { id: 2, user: 'TechAnalyst', message: 'RSI showing oversold conditions', time: '5m' },
    { id: 3, user: 'WhaleWatcher', message: 'Large BTC transfer detected 👀', time: '8m' },
    { id: 4, user: 'MarketMaker', message: 'Volume spike in altcoins', time: '12m' },
  ]);

  const handleProfileEdit = () => {
    setDismissedAutoPrompt(null);
    setShowUsernameDialog(true);
  };

  const handleProfileCreated = () => {
    setShowUsernameDialog(false);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open && !showUsernameDialog) {
      setDismissedAutoPrompt(walletAddress);
    }
    setShowUsernameDialog(open);
  };

  const shouldShowDialog = walletAddress && !profileError && (
    showUsernameDialog || (needsProfile && dismissedAutoPrompt !== walletAddress)
  );

  const handleSocialInteraction = (feedId: number) => {
    console.log(`Social interaction with feed ${feedId}`);
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Create holdings array that includes BNB from connected wallet
  const allHoldings = [
    // Add BNB holding if wallet is connected and has balance
    ...(connected && bnb > 0 ? [{
      mint: 'BNB',
      symbol: 'BNB',
      balance: bnb,
      usdValue: usd,
    }] : []),
    // Add other holdings from portfolio analyzer
    ...topHoldings,
  ];
  
  const totalPortfolioValue = allHoldings.reduce((sum, h) => sum + h.usdValue, 0);
  
  // Calculate P&L for wallet balance using BNB price change
  const walletPnlPercentage = priceData?.price_change_percentage_24h || 0;
  const walletPnlAmount = usd * (walletPnlPercentage / 100);

  return (
    <aside className="w-full h-full bg-sidebar cyber-border p-4 space-y-4 cyber-scrollbar overflow-y-auto">
      {/* User Profile Card */}
      <Card className="p-4 cyber-border">
        <div className="text-center">
          <Avatar className="w-20 h-20 mx-auto mb-3 cyber-border">
            <AvatarImage src="/memes/Cyberpunk_trader_avatar_9c40e50f.png" alt="User Avatar" />
            <AvatarFallback>CX</AvatarFallback>
          </Avatar>
          {!connected ? (
            <>
              <h3 className="font-cyber text-lg cyber-glow mb-2">CONNECT WALLET</h3>
              <p className="text-sm font-mono text-muted-foreground mb-3">
                Link your BSC wallet
              </p>
              <Button 
                size="sm" 
                variant="default" 
                className="w-full font-mono"
                onClick={connect}
                disabled={connecting}
                data-testid="button-connect-wallet"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    CONNECTING...
                  </>
                ) : (
                  <>
                    <Wallet className="w-3 h-3 mr-1" />
                    CONNECT WALLET
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <h3 className="font-cyber text-lg cyber-glow" data-testid="text-wallet-address">
                {profile?.username || (walletAddress ? formatWalletAddress(walletAddress) : 'CYBER_TRADER')}
              </h3>
              <p className="text-sm font-mono text-muted-foreground mb-3">
                {profile ? 'Elite Member' : 'Connected'}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="text-center">
                  {balanceLoading ? (
                    <div className="text-cyber-gold font-cyber">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    </div>
                  ) : (
                    <div className="text-cyber-gold font-cyber" data-testid="text-balance-usd">
                      {formatCurrency(usd)}
                    </div>
                  )}
                  <div className="text-muted-foreground">Balance</div>
                </div>
                <div className="text-center">
                  {balanceLoading ? (
                    <div className="text-cyber-success font-cyber">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    </div>
                  ) : (
                    <div 
                      className={`font-cyber ${walletPnlPercentage >= 0 ? 'text-cyber-success' : 'text-cyber-error'}`}
                      data-testid="text-pnl-percentage"
                    >
                      {walletPnlPercentage >= 0 ? '+' : ''}{walletPnlPercentage.toFixed(2)}%
                    </div>
                  )}
                  <div className="text-muted-foreground">24h P&L</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="font-mono"
                  onClick={handleProfileEdit}
                  disabled={profileLoading}
                  data-testid="button-edit-profile"
                >
                  <User className="w-3 h-3 mr-1" />
                  PROFILE
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="font-mono"
                  onClick={disconnect}
                  data-testid="button-disconnect-wallet"
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  DISCONNECT
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Portfolio Holdings */}
      {connected && (
        <Card className="p-4 cyber-border">
          <h2 className="text-lg font-cyber cyber-glow mb-4">TOP HOLDINGS</h2>
          {portfolioLoading || balanceLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : allHoldings.length === 0 ? (
            <div className="text-center py-8 text-sm font-mono text-muted-foreground">
              No holdings found
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {allHoldings.map((holding, index) => {
                  const percentage = totalPortfolioValue > 0 
                    ? (holding.usdValue / totalPortfolioValue) * 100 
                    : 0;
                  return (
                    <div key={holding.mint} className="space-y-1" data-testid={`holding-${index}`}>
                      <div className="flex justify-between text-sm font-mono">
                        <span>{holding.symbol}</span>
                        <span>{percentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{holding.balance.toFixed(4)}</span>
                        <span>{formatCurrency(holding.usdValue)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-center">
                <div className="text-2xl font-cyber cyber-glow" data-testid="text-total-portfolio-value">
                  {formatCurrency(totalPortfolioValue)}
                </div>
                <div className="text-xs font-mono text-muted-foreground">Total Value</div>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Top Traders Leaderboard */}
      <Card className="p-4 cyber-border">
        <h2 className="text-lg font-cyber cyber-glow mb-4 flex items-center">
          <Trophy className="w-5 h-5 mr-2" />
          TOP TRADERS
        </h2>
        {showTopTradersPlaceholder ? (
          <div className="text-center py-8 px-4">
            <div className="text-sm font-mono text-muted-foreground mb-2">
              🚀 Four.meme Bonding Phase
            </div>
            <p className="text-xs font-mono text-muted-foreground leading-relaxed">
              Trader data will update when pool migrates to PancakeSwap
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Future: Dynamic trader data will be displayed here */}
          </div>
        )}
      </Card>

      {/* Username Dialog */}
      {shouldShowDialog && (
        <UsernameDialog
          open={shouldShowDialog}
          onOpenChange={handleDialogOpenChange}
          walletAddress={walletAddress}
          currentUsername={profile?.username}
          isEditing={hasProfile}
          onSuccess={handleProfileCreated}
        />
      )}

      {/* Social Feed */}
      <Card className="p-4 cyber-border">
        <h2 className="text-lg font-cyber cyber-glow mb-4 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2" />
          SOCIAL FEED
        </h2>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {socialFeed.map((post) => (
            <div 
              key={post.id} 
              className="p-2 rounded bg-card/50 cyber-border cursor-pointer hover-elevate"
              onClick={() => handleSocialInteraction(post.id)}
              data-testid={`social-post-${post.id}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-mono text-cyber-blue">{post.user}</span>
                <span className="text-xs text-muted-foreground">{post.time}</span>
              </div>
              <p className="text-xs font-mono">{post.message}</p>
            </div>
          ))}
        </div>
      </Card>
    </aside>
  );
}