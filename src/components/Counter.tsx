import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseAbi } from 'viem';

const COUNTER_ADDRESS = '0x5fbdb2315678afecb367f032d93f642f64180aa3';

const counterAbi = parseAbi([
  'function x() view returns (uint256)',
  'function owner() view returns (address)', 
  'function paused() view returns (bool)',
  'function totalIncrements() view returns (uint256)',
  'function inc()',
  'function incBy(uint256 amount)',
  'function dec()',
  'function decBy(uint256 amount)',
  'function reset()',
  'function pause()',
  'function getUserIncrements(address user) view returns (uint256)',
  'function getContractInfo() view returns (uint256, uint256, address, bool)'
]);

const Counter: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [incrementAmount, setIncrementAmount] = useState<string>('1');
  const [decrementAmount, setDecrementAmount] = useState<string>('1');

  const { data: counterValue, refetch: refetchCounter } = useReadContract({
    address: COUNTER_ADDRESS,
    abi: counterAbi,
    functionName: 'x',
  });

  const { data: contractInfo, refetch: refetchInfo } = useReadContract({
    address: COUNTER_ADDRESS,
    abi: counterAbi,
    functionName: 'getContractInfo',
  });

  const { data: userIncrements, refetch: refetchUserIncrements } = useReadContract({
    address: COUNTER_ADDRESS,
    abi: counterAbi,
    functionName: 'getUserIncrements',
    args: address ? [address] : undefined,
  });

  const { writeContract: inc, data: incHash } = useWriteContract();
  const { writeContract: incBy, data: incByHash } = useWriteContract();
  const { writeContract: dec, data: decHash } = useWriteContract();
  const { writeContract: decBy, data: decByHash } = useWriteContract();
  const { writeContract: reset, data: resetHash } = useWriteContract();
  const { writeContract: pause, data: pauseHash } = useWriteContract();

  const { isLoading: isIncLoading, isSuccess: isIncSuccess } = useWaitForTransactionReceipt({
    hash: incHash,
  });

  const { isLoading: isIncByLoading, isSuccess: isIncBySuccess } = useWaitForTransactionReceipt({
    hash: incByHash,
  });

  const { isLoading: isDecLoading, isSuccess: isDecSuccess } = useWaitForTransactionReceipt({
    hash: decHash,
  });

  const { isLoading: isDecByLoading, isSuccess: isDecBySuccess } = useWaitForTransactionReceipt({
    hash: decByHash,
  });

  const { isLoading: isResetLoading, isSuccess: isResetSuccess } = useWaitForTransactionReceipt({
    hash: resetHash,
  });

  const { isLoading: isPauseLoading, isSuccess: isPauseSuccess } = useWaitForTransactionReceipt({
    hash: pauseHash,
  });

  useEffect(() => {
    if (isIncSuccess || isIncBySuccess || isResetSuccess) {
      refetchCounter();
      refetchInfo();
      refetchUserIncrements();
    }
  }, [isIncSuccess, isIncBySuccess, isResetSuccess, refetchCounter, refetchInfo, refetchUserIncrements]);

  useEffect(() => {
    if (isDecSuccess || isDecBySuccess || isPauseSuccess) {
      refetchCounter();
      refetchInfo();
    }
  }, [isDecSuccess, isDecBySuccess, isPauseSuccess, refetchCounter, refetchInfo]);

  const handleInc = () => {
    inc({
      address: COUNTER_ADDRESS,
      abi: counterAbi,
      functionName: 'inc',
    });
  };

  const handleIncBy = () => {
    incBy({
      address: COUNTER_ADDRESS,
      abi: counterAbi,
      functionName: 'incBy',
      args: [BigInt(incrementAmount)],
    });
  };

  const handleDec = () => {
    dec({
      address: COUNTER_ADDRESS,
      abi: counterAbi,
      functionName: 'dec',
    });
  };

  const handleDecBy = () => {
    decBy({
      address: COUNTER_ADDRESS,
      abi: counterAbi,
      functionName: 'decBy',
      args: [BigInt(decrementAmount)],
    });
  };

  const handleReset = () => {
    reset({
      address: COUNTER_ADDRESS,
      abi: counterAbi,
      functionName: 'reset',
    });
  };

  const handlePause = () => {
    pause({
      address: COUNTER_ADDRESS,
      abi: counterAbi,
      functionName: 'pause',
    });
  };

  if (!isConnected) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Connect Your Wallet</h2>
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            style={{ 
              margin: '10px', 
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Connect {connector.name}
          </button>
        ))}
      </div>
    );
  }

  const currentValue = contractInfo ? contractInfo[0] : counterValue;
  const totalIncrements = contractInfo ? contractInfo[1] : BigInt(0);
  const contractOwner = contractInfo ? contractInfo[2] : '';
  const isPaused = contractInfo ? contractInfo[3] : false;
  const isOwner = address && contractOwner && address.toLowerCase() === contractOwner.toLowerCase();

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h2>Enhanced Counter DApp</h2>
        <p>Connected: {address}</p>
        <button 
          onClick={() => disconnect()}
          style={{ 
            padding: '5px 15px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Disconnect
        </button>
      </div>

      <div style={{ 
        marginBottom: '30px', 
        padding: '20px', 
        border: '1px solid #ddd', 
        borderRadius: '8px',
        backgroundColor: isPaused ? '#ffebee' : '#e8f5e8'
      }}>
        <h3>Contract Status</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div><strong>Current Value:</strong> {currentValue?.toString() || '0'}</div>
          <div><strong>Total Increments:</strong> {totalIncrements?.toString() || '0'}</div>
          <div><strong>Your Increments:</strong> {userIncrements?.toString() || '0'}</div>
          <div><strong>Status:</strong> {isPaused ? ' PAUSED' : ' Active'}</div>
          <div><strong>Owner:</strong> {isOwner ? 'You' : `${contractOwner?.slice(0, 6)}...${contractOwner?.slice(-4)}`}</div>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>Basic Operations</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleInc} 
            disabled={isIncLoading || isPaused}
            style={{ 
              padding: '10px 20px',
              backgroundColor: isPaused ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isPaused ? 'not-allowed' : 'pointer'
            }}
          >
            {isIncLoading ? 'Incrementing...' : '+1'}
          </button>
          
          <button 
            onClick={handleDec} 
            disabled={isDecLoading || isPaused || currentValue === BigInt(0)}
            style={{ 
              padding: '10px 20px',
              backgroundColor: (isPaused || currentValue === BigInt(0)) ? '#ccc' : '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: (isPaused || currentValue === BigInt(0)) ? 'not-allowed' : 'pointer'
            }}
          >
            {isDecLoading ? 'Decrementing...' : '-1'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="number"
            value={incrementAmount}
            onChange={(e) => setIncrementAmount(e.target.value)}
            placeholder="Amount to increment"
            style={{ padding: '8px', borderRadius: '3px', border: '1px solid #ddd' }}
          />
          <button 
            onClick={handleIncBy} 
            disabled={isIncByLoading || isPaused}
            style={{ 
              padding: '8px 16px',
              backgroundColor: isPaused ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isPaused ? 'not-allowed' : 'pointer'
            }}
          >
            {isIncByLoading ? 'Incrementing...' : `+${incrementAmount}`}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
          <input
            type="number"
            value={decrementAmount}
            onChange={(e) => setDecrementAmount(e.target.value)}
            placeholder="Amount to decrement"
            style={{ padding: '8px', borderRadius: '3px', border: '1px solid #ddd' }}
          />
          <button 
            onClick={handleDecBy} 
            disabled={isDecByLoading || isPaused}
            style={{ 
              padding: '8px 16px',
              backgroundColor: isPaused ? '#ccc' : '#fd7e14',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isPaused ? 'not-allowed' : 'pointer'
            }}
          >
            {isDecByLoading ? 'Decrementing...' : `-${decrementAmount}`}
          </button>
        </div>
      </div>

      {isOwner && (
        <div style={{ 
          marginBottom: '30px',
          padding: '20px',
          border: '2px solid #ffc107',
          borderRadius: '8px',
          backgroundColor: '#fff3cd'
        }}>
          <h3> Owner Operations</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <button 
              onClick={handlePause} 
              disabled={isPauseLoading}
              style={{ 
                padding: '10px 20px',
                backgroundColor: isPaused ? '#28a745' : '#ffc107',
                color: isPaused ? 'white' : 'black',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              {isPauseLoading ? 'Processing...' : (isPaused ? 'Unpause' : 'Pause')}
            </button>

            <button 
              onClick={handleReset} 
              disabled={isResetLoading}
              style={{ 
                padding: '10px 20px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              {isResetLoading ? 'Resetting...' : 'Reset Counter'}
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        <h4>Instructions:</h4>
        <ul style={{ textAlign: 'left' }}>
          <li>Make sure your local Hardhat network is running</li>
          <li>Contract address: <code>{COUNTER_ADDRESS}</code></li>
          <li>Connect MetaMask to localhost:8545 (Chain ID: 31337)</li>
          <li>Import a test account using Hardhat private keys</li>
          {isPaused && <li style={{ color: 'red' }}><strong> Contract is currently PAUSED</strong></li>}
        </ul>
      </div>
    </div>
  );
};

export default Counter;
