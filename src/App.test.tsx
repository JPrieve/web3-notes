import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock wagmi to avoid ESM module issues
jest.mock('wagmi', () => ({
  WagmiProvider: ({ children }: any) => <div>{children}</div>,
  useAccount: () => ({ address: undefined, isConnected: false }),
  useConnect: () => ({ connectors: [], connect: jest.fn() }),
  useDisconnect: () => ({ disconnect: jest.fn() }),
  useReadContract: () => ({ data: undefined, refetch: jest.fn() }),
  useWriteContract: () => ({ data: undefined, writeContract: jest.fn(), isPending: false }),
  useWaitForTransactionReceipt: () => ({ isLoading: false, isSuccess: false }),
  createConfig: jest.fn(),
  http: jest.fn()
}));

// Mock wagmi/chains
jest.mock('wagmi/chains', () => ({
  mainnet: { id: 1, name: 'Mainnet' },
  sepolia: { id: 11155111, name: 'Sepolia' },
  hardhat: { id: 31337, name: 'Hardhat' }
}));

// Mock wagmi/connectors
jest.mock('wagmi/connectors', () => ({
  injected: jest.fn()
}));

// Mock viem
jest.mock('viem', () => ({
  createPublicClient: jest.fn(),
  http: jest.fn(),
  parseEther: jest.fn()
}));

// Mock viem/chains
jest.mock('viem/chains', () => ({
  hardhat: { id: 31337, name: 'Hardhat' }
}));

// Mock @tanstack/react-query
jest.mock('@tanstack/react-query', () => ({
  QueryClient: jest.fn().mockImplementation(() => ({
    mount: jest.fn(),
    unmount: jest.fn()
  })),
  QueryClientProvider: ({ children }: any) => <div>{children}</div>
}));

describe('App Component', () => {
  test('renders Web3 Notes DApp heading', () => {
    render(<App />);
    const headingElement = screen.getByText(/Web3 Notes DApp/i);
    expect(headingElement).toBeInTheDocument();
  });
});
