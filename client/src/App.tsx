import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { WalletProvider } from "@/contexts/WalletContext";
import { TradingSymbolProvider } from "@/contexts/TradingSymbolContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Force dark mode for cyberpunk theme
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <TradingSymbolProvider>
          <TooltipProvider>
            <div className="cyberpunk-app">
              <Router />
              <Toaster />
            </div>
          </TooltipProvider>
        </TradingSymbolProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
