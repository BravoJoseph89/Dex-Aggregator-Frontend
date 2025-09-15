import { useEffect, useState, useCallback } from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import { CONTRACTS, ABI } from '../config';

// Initialize contracts
const initializeContracts = (provider, account) => {
  if (!provider || !account) return {};
  
  const signer = provider.getSigner();
  
  return {
    // Token contracts
    sefi: new ethers.Contract(CONTRACTS.SEFI, ABI.ERC20, signer),
    chloe: new ethers.Contract(CONTRACTS.CHLOE, ABI.ERC20, signer),
    zoe: new ethers.Contract(CONTRACTS.ZOE, ABI.ERC20, signer),
    maggie: new ethers.Contract(CONTRACTS.MAGGIE, ABI.ERC20, signer),
    
    // AMM contracts
    amm1: new ethers.Contract(CONTRACTS.AMM1, ABI.AMM, signer),
    amm2: new ethers.Contract(CONTRACTS.AMM2, ABI.AMM, signer),
    
    // Aggregator contract
    aggregator: new ethers.Contract(CONTRACTS.AGGREGATOR, ABI.Aggregator, signer)
  };
};

export const useDexAggregator = () => {
  const { library: provider, account } = useWeb3React();
  const [contracts, setContracts] = useState({});
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize contracts when provider/account changes
  useEffect(() => {
    if (provider && account) {
      setContracts(initializeContracts(provider, account));
    }
  }, [provider, account]);

  // Fetch token balances
  const fetchBalances = useCallback(async () => {
    if (!provider || !account || !contracts.sefi) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const tokenAddresses = [
        { symbol: 'SEFI', contract: contracts.sefi },
        { symbol: 'CHLOE', contract: contracts.chloe },
        { symbol: 'ZOE', contract: contracts.zoe },
        { symbol: 'MAGGIE', contract: contracts.maggie }
      ];
      
      const balancePromises = tokenAddresses.map(async ({ symbol, contract }) => {
        try {
          const balance = await contract.balanceOf(account);
          return [symbol, ethers.utils.formatEther(balance)];
        } catch (err) {
          console.error(`Error fetching ${symbol} balance:`, err);
          return [symbol, '0'];
        }
      });
      
      const balancesArray = await Promise.all(balancePromises);
      const balancesObj = Object.fromEntries(balancesArray);
      setBalances(balancesObj);
      
    } catch (err) {
      console.error('Error fetching balances:', err);
      setError('Failed to fetch balances');
    } finally {
      setLoading(false);
    }
  }, [contracts, account, provider]);

  // Get best price for a swap
  const getBestPrice = useCallback(async (fromToken, toToken, amount) => {
    if (!contracts.aggregator || !amount) return null;
    
    try {
      const amountInWei = ethers.utils.parseEther(amount.toString());
      const [amountOut, dexAddress] = await contracts.aggregator.getBestPrice(
        contracts[fromToken.toLowerCase()]?.address,
        contracts[toToken.toLowerCase()]?.address,
        amountInWei
      );
      
      return {
        amountOut: ethers.utils.formatEther(amountOut),
        dex: dexAddress === CONTRACTS.AMM1 ? 'DEX1' : 'DEX2'
      };
    } catch (err) {
      console.error('Error getting best price:', err);
      setError('Failed to get price quote');
      return null;
    }
  }, [contracts]);

  // Execute a swap
  const executeSwap = useCallback(async (fromToken, toToken, amount, minAmountOut) => {
    if (!contracts.aggregator || !account) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const amountInWei = ethers.utils.parseEther(amount.toString());
      const minAmountOutWei = ethers.utils.parseEther(minAmountOut.toString());
      
      // Approve token spending if needed
      const tokenContract = contracts[fromToken.toLowerCase()];
      const allowance = await tokenContract.allowance(account, CONTRACTS.AGGREGATOR);
      
      if (allowance.lt(amountInWei)) {
        const approveTx = await tokenContract.approve(CONTRACTS.AGGREGATOR, amountInWei);
        await approveTx.wait();
      }
      
      // Execute swap
      const tx = await contracts.aggregator.swap(
        tokenContract.address,
        contracts[toToken.toLowerCase()].address,
        amountInWei,
        minAmountOutWei,
        account
      );
      
      const receipt = await tx.wait();
      await fetchBalances(); // Refresh balances
      
      return receipt.transactionHash;
      
    } catch (err) {
      console.error('Error executing swap:', err);
      setError('Swap failed: ' + (err.message || 'Unknown error'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [contracts, account, fetchBalances]);

  return {
    contracts,
    balances,
    loading,
    error,
    fetchBalances,
    getBestPrice,
    executeSwap
  };
};
