import { createContext, useState, useEffect, useRef, ReactNode } from 'react';

export interface WalletContextType {
  walletAddress: string | null;
  connected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isWalletInstalled: boolean;
  chainId: number | null;
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

const WALLET_AUTOCONNECT_KEY = 'wallet-autoconnect';
const BSC_CHAIN_ID = 56;
const BSC_CHAIN_ID_HEX = '0x38';
const BSC_RPC_URL = 'https://bsc-dataseed.binance.org/';

interface BSCNetworkParams {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

const BSC_NETWORK: BSCNetworkParams = {
  chainId: BSC_CHAIN_ID_HEX,
  chainName: 'BNB Smart Chain',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  rpcUrls: [BSC_RPC_URL],
  blockExplorerUrls: ['https://bscscan.com'],
};

export function WalletProvider({ children }: WalletProviderProps) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isWalletInstalled, setIsWalletInstalled] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const listenersAttachedRef = useRef(false);

  useEffect(() => {
    const ethereum = (window as any).ethereum;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setConnected(true);
      } else {
        setWalletAddress(null);
        setConnected(false);
        localStorage.removeItem(WALLET_AUTOCONNECT_KEY);
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);
      
      if (newChainId !== BSC_CHAIN_ID) {
        console.warn(`Wrong network detected. Please switch to BSC (Chain ID: ${BSC_CHAIN_ID})`);
      }
    };

    const handleDisconnect = () => {
      setWalletAddress(null);
      setConnected(false);
      setChainId(null);
      localStorage.removeItem(WALLET_AUTOCONNECT_KEY);
    };

    const checkWallet = async () => {
      if (ethereum) {
        setIsWalletInstalled(true);

        if (!listenersAttachedRef.current) {
          ethereum.on('accountsChanged', handleAccountsChanged);
          ethereum.on('chainChanged', handleChainChanged);
          ethereum.on('disconnect', handleDisconnect);
          listenersAttachedRef.current = true;
        }

        try {
          const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
          setChainId(parseInt(chainIdHex, 16));
        } catch (error) {
          console.error('Error getting chain ID:', error);
        }

        const shouldAutoConnect = localStorage.getItem(WALLET_AUTOCONNECT_KEY) === 'true';

        if (shouldAutoConnect) {
          try {
            const accounts = await ethereum.request({ 
              method: 'eth_accounts' 
            });
            
            if (accounts.length > 0) {
              setWalletAddress(accounts[0]);
              setConnected(true);
            }
          } catch (error) {
            console.log('Auto-connect skipped or rejected');
          }
        }
      }
    };

    checkWallet();

    return () => {
      if (ethereum && listenersAttachedRef.current) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
        ethereum.removeListener('disconnect', handleDisconnect);
        listenersAttachedRef.current = false;
      }
    };
  }, []);

  const switchToBSC = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BSC_CHAIN_ID_HEX }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [BSC_NETWORK],
          });
        } catch (addError) {
          console.error('Error adding BSC network:', addError);
          throw addError;
        }
      } else {
        console.error('Error switching to BSC:', switchError);
        throw switchError;
      }
    }
  };

  const connect = async () => {
    if (!isWalletInstalled) {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    try {
      setConnecting(true);
      const ethereum = (window as any).ethereum;

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setConnected(true);
        localStorage.setItem(WALLET_AUTOCONNECT_KEY, 'true');

        const currentChainId = await ethereum.request({ method: 'eth_chainId' });
        const currentChainIdDecimal = parseInt(currentChainId, 16);
        setChainId(currentChainIdDecimal);

        if (currentChainIdDecimal !== BSC_CHAIN_ID) {
          await switchToBSC();
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      setWalletAddress(null);
      setConnected(false);
      setChainId(null);
      localStorage.removeItem(WALLET_AUTOCONNECT_KEY);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        connected,
        connecting,
        connect,
        disconnect,
        isWalletInstalled,
        chainId,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
