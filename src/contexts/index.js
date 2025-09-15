import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useWeb3React } from '@web3-react/core';
// Web3Provider imported for type checking
import { injected } from '../connectors';
import { useDexAggregator } from '../hooks';

const initialState = {
  isConnected: false,
  account: null,
  chainId: null,
  balances: {},
  fromToken: 'SEFI',
  toToken: 'CHLOE',
  amount: '',
  slippage: 0.5,
  loading: false,
  error: null,
  txHash: null,
  lastSwap: null
};

const AppContext = createContext();

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_ACCOUNT':
      return { ...state, account: action.payload };
    case 'SET_CHAIN_ID':
      return { ...state, chainId: action.payload };
    case 'SET_BALANCES':
      return { ...state, balances: action.payload };
    case 'SET_FROM_TOKEN':
      return { ...state, fromToken: action.payload };
    case 'SET_TO_TOKEN':
      return { ...state, toToken: action.payload };
    case 'SET_AMOUNT':
      return { ...state, amount: action.payload };
    case 'SET_SLIPPAGE':
      return { ...state, slippage: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_TX_HASH':
      return { ...state, txHash: action.payload };
    case 'SET_LAST_SWAP':
      return { ...state, lastSwap: action.payload };
    case 'SWAP_TOKENS':
      return {
        ...state,
        fromToken: state.toToken,
        toToken: state.fromToken,
      };
    case 'SET_IS_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'RESET_STATE':
      return initialState;
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const { account, chainId, activate, deactivate } = useWeb3React();
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { getBalances, getBestPrice, executeSwap } = useDexAggregator();

  // Handle wallet connection
  const connect = useCallback(async () => {
    try {
      await activate(injected);
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [activate]);

  // Handle wallet disconnection
  const disconnect = useCallback(() => {
    try {
      deactivate();
      dispatch({ type: 'RESET_STATE' });
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [deactivate]);

  // Update state when account or chain changes
  useEffect(() => {
    if (account && chainId) {
      dispatch({ type: 'SET_ACCOUNT', payload: account });
      dispatch({ type: 'SET_CHAIN_ID', payload: chainId });
      dispatch({ type: 'SET_IS_CONNECTED', payload: true });
      
      // Fetch balances when connected
      const fetchBalances = async () => {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          const balances = await getBalances(account);
          dispatch({ type: 'SET_BALANCES', payload: balances });
        } catch (error) {
          console.error('Error fetching balances:', error);
          dispatch({ type: 'SET_ERROR', payload: error.message });
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      };
      
      fetchBalances();
    } else {
      dispatch({ type: 'SET_IS_CONNECTED', payload: false });
    }
  }, [account, chainId, getBalances]);

  const value = {
    ...state,
    connect,
    disconnect,
    getBalances: async (address = account) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const balances = await getBalances(address || account);
        dispatch({ type: 'SET_BALANCES', payload: balances });
        return balances;
      } catch (error) {
        console.error('Error fetching balances:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    getBestPrice: async (fromToken, toToken, amount) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const price = await getBestPrice(fromToken, toToken, amount);
        return price;
      } catch (error) {
        console.error('Error getting best price:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    executeSwap: async (fromToken, toToken, amount, slippage = state.slippage) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const result = await executeSwap(fromToken, toToken, amount, slippage);
        dispatch({ 
          type: 'SET_LAST_SWAP', 
          payload: { fromToken, toToken, amount, txHash: result.txHash } 
        });
        return result;
      } catch (error) {
        console.error('Error executing swap:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    setFromToken: (token) => dispatch({ type: 'SET_FROM_TOKEN', payload: token }),
    setToToken: (token) => dispatch({ type: 'SET_TO_TOKEN', payload: token }),
    setAmount: (amount) => dispatch({ type: 'SET_AMOUNT', payload: amount }),
    setSlippage: (slippage) => dispatch({ type: 'SET_SLIPPAGE', payload: slippage }),
    clearError: () => dispatch({ type: 'CLEAR_ERROR' })
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
