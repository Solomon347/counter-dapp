
import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useContractRead, useContractWrite, useBalance } from '@starknet-react/core';
import { Contract, RpcProvider } from 'starknet';

// Contract ABI
const CONTRACT_ABI = [
  {
    type: 'function',
    name: 'get_count',
    inputs: [],
    outputs: [{ type: 'core::integer::u32' }],
    state_mutability: 'view'
  },
  {
    type: 'function',
    name: 'increase_count',
    inputs: [],
    outputs: [],
    state_mutability: 'external'
  },
  {
    type: 'function',
    name: 'decrease_count',
    inputs: [],
    outputs: [],
    state_mutability: 'external'
  },
  {
    type: 'function',
    name: 'increase_count_by',
    inputs: [{ name: 'value', type: 'core::integer::u32' }],
    outputs: [],
    state_mutability: 'external'
  },
  {
    type: 'function',
    name: 'decrease_count_by',
    inputs: [{ name: 'value', type: 'core::integer::u32' }],
    outputs: [],
    state_mutability: 'external'
  }
];

// TODO: Replace with your deployed contract address after deployment
const CONTRACT_ADDRESS = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';

// USDC contract address on Starknet Sepolia
const USDC_ADDRESS = '0x053b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080';

const USDC_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'felt' }],
    outputs: [{ name: 'balance', type: 'Uint256' }],
    stateMutability: 'view'
  }
];

function App() {
  const { address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [inputValue, setInputValue] = useState('');
  const [usdcBalance, setUsdcBalance] = useState(null);
  const [isLoadingUsdc, setIsLoadingUsdc] = useState(false);
  const [isIncreasing, setIsIncreasing] = useState(false);
  const [isDecreasing, setIsDecreasing] = useState(false);

  // Get STRK balance using Starknet React
  const { data: strkBalance, isLoading: isLoadingStrk } = useBalance({
    address,
    watch: true
  });

  // Get count from contract
  const { data: count, isLoading: isLoadingCount, refetch } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'get_count',
    watch: true
  });

  // Contract write hooks
  const { writeAsync: increaseCount } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'increase_count'
  });

  const { writeAsync: decreaseCount } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'decrease_count'
  });

  const { writeAsync: increaseCountBy } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'increase_count_by'
  });

  const { writeAsync: decreaseCountBy } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'decrease_count_by'
  });

  // Fetch USDC balance using Starknet.js
  useEffect(() => {
    const fetchUsdcBalance = async () => {
      if (!address) return;
      
      setIsLoadingUsdc(true);
      try {
        const provider = new RpcProvider({
          nodeUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7'
        });
        
        const contract = new Contract(USDC_ABI, USDC_ADDRESS, provider);
        const balance = await contract.balanceOf(address);
        
        // USDC has 6 decimals
        const formattedBalance = Number(balance) / 1e6;
        setUsdcBalance(formattedBalance);
      } catch (error) {
        console.error('Error fetching USDC balance:', error);
        setUsdcBalance(0);
      } finally {
        setIsLoadingUsdc(false);
      }
    };

    fetchUsdcBalance();
  }, [address]);

  const handleIncreaseBy = async () => {
    if (!inputValue || Number(inputValue) <= 0) return;
    
    setIsIncreasing(true);
    try {
      await increaseCountBy({ args: [Number(inputValue)] });
      await refetch();
      setInputValue('');
    } catch (error) {
      console.error('Error increasing count:', error);
    } finally {
      setIsIncreasing(false);
    }
  };

  const handleDecreaseBy = async () => {
    if (!inputValue || Number(inputValue) <= 0) return;
    
    setIsDecreasing(true);
    try {
      await decreaseCountBy({ args: [Number(inputValue)] });
      await refetch();
      setInputValue('');
    } catch (error) {
      console.error('Error decreasing count:', error);
    } finally {
      setIsDecreasing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            Counter Dapp
          </h1>
          <p className="text-gray-300">Cairo Bootcamp V - Week 3 Assignment</p>
        </header>

        {/* Wallet Connection */}
        <div className="flex justify-center mb-8">
          {!address ? (
            <div className="space-x-4">
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => connect({ connector })}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-6 py-3 rounded-lg font-semibold transition transform hover:scale-105"
                >
                  Connect {connector.name}
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-md rounded-lg px-6 py-3 border border-white/20">
              <p className="text-sm text-gray-300">Connected:</p>
              <p className="font-mono text-sm">{address.slice(0, 6)}...{address.slice(-4)}</p>
              <button
                onClick={() => disconnect()}
                className="mt-2 text-red-400 hover:text-red-300 text-sm"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {address && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Balances Section */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* STRK Balance */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold mb-3 text-purple-300">STRK Balance</h3>
                {isLoadingStrk ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  <p className="text-3xl font-bold">
                    {strkBalance ? (Number(strkBalance.formatted)).toFixed(4) : '0.0000'} STRK
                  </p>
                )}
              </div>

              {/* USDC Balance */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold mb-3 text-blue-300">USDC Balance</h3>
                {isLoadingUsdc ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  <p className="text-3xl font-bold">
                    {usdcBalance !== null ? usdcBalance.toFixed(2) : '0.00'} USDC
                  </p>
                )}
              </div>
            </div>

            {/* Counter Section */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold mb-6 text-center">Counter</h2>
              
              {/* Current Count */}
              <div className="text-center mb-8">
                {isLoadingCount ? (
                  <div className="flex justify-center items-center space-x-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    <span className="text-xl">Loading count...</span>
                  </div>
                ) : (
                  <div className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-400">
                    {count?.toString() || '0'}
                  </div>
                )}
              </div>

              {/* Input and Buttons */}
              <div className="space-y-4">
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter a number"
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min="1"
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={handleIncreaseBy}
                    disabled={!inputValue || Number(inputValue) <= 0 || isIncreasing}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition transform hover:scale-105 disabled:transform-none"
                  >
                    {isIncreasing ? (
                      <span className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </span>
                    ) : (
                      `Increase count by ${inputValue || '0'}`
                    )}
                  </button>

                  <button
                    onClick={handleDecreaseBy}
                    disabled={!inputValue || Number(inputValue) <= 0 || isDecreasing}
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition transform hover:scale-105 disabled:transform-none"
                  >
                    {isDecreasing ? (
                      <span className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </span>
                    ) : (
                      `Decrease count by ${inputValue || '0'}`
                    )}
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4 pt-4">
                  <button
                    onClick={async () => {
                      try {
                        await increaseCount();
                        await refetch();
                      } catch (error) {
                        console.error('Error:', error);
                      }
                    }}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-6 py-3 rounded-lg font-semibold transition transform hover:scale-105"
                  >
                    Increase by 1
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        await decreaseCount();
                        await refetch();
                      } catch (error) {
                        console.error('Error:', error);
                      }
                    }}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 px-6 py-3 rounded-lg font-semibold transition transform hover:scale-105"
                  >
                    Decrease by 1
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
