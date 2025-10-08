import { Badge } from "@/components/ui/badge";
import { Activity, Wifi, Zap, Shield, Twitter, ExternalLink } from "lucide-react";

export default function CyberFooter() {
  return (
    <footer className="bg-card cyber-border p-3">
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Wifi className="w-3 h-3 text-cyber-success" />
            <span>CONNECTED</span>
          </div>
          <div className="flex items-center space-x-1">
            <Activity className="w-3 h-3 text-cyber-blue animate-pulse" />
            <span>LIVE DATA</span>
          </div>
          <div className="flex items-center space-x-1">
            <Shield className="w-3 h-3 text-cyber-gold" />
            <span>SECURE</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-xs">
            <Zap className="w-3 h-3 mr-1" />
            LATENCY: 12ms
          </Badge>
          <div className="text-muted-foreground">
            暗池 DARK POOL v3.0.0 | © 2025 Dark Pool Systems
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <a 
            href="https://twitter.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-cyber-blue hover:text-cyber-blue/80 transition-colors"
          >
            <Twitter className="w-3 h-3" />
            <span>Twitter</span>
            <ExternalLink className="w-2 h-2" />
          </a>
          <a 
            href="https://four.meme" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-cyber-gold hover:text-cyber-gold/80 transition-colors"
          >
            <Zap className="w-3 h-3" />
            <span>four.meme</span>
            <ExternalLink className="w-2 h-2" />
          </a>
        </div>
      </div>
    </footer>
  );
}