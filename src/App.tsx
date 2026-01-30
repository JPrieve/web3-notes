import React from 'react';
import { WagmiProvider, useAccount, useConnect, useDisconnect } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Notes from './components/Notes';
import { config } from './wagmiConfig';
import './App.css';

const queryClient = new QueryClient();

function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div className="wallet-container">
        <span className="wallet-address">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="btn btn-danger"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-container">
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          className="btn btn-primary"
        >
          Connect {connector.name}
        </button>
      ))}
    </div>
  );
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="app-container">
          <div className="app-header">
            <h1 className="app-title">📝 Web3 Notes</h1>
            <ConnectWallet />
          </div>
          <Notes />
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
