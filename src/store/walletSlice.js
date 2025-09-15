import { createSlice } from '@reduxjs/toolkit';
import { ethers } from 'ethers';

const initialState = {
  isConnected: false,
  account: null,
  chainId: null,
  provider: null,
  isLoading: false,
  error: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    connectWalletRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    connectWalletSuccess: (state, action) => {
      state.isConnected = true;
      state.account = action.payload.account;
      state.chainId = action.payload.chainId;
      state.provider = action.payload.provider;
      state.isLoading = false;
    },
    connectWalletFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    disconnectWallet: (state) => {
      state.isConnected = false;
      state.account = null;
      state.chainId = null;
      state.provider = null;
      state.error = null;
    },
    setProvider: (state, action) => {
      state.provider = action.payload;
    },
    setAccount: (state, action) => {
      state.account = action.payload;
    },
    setChainId: (state, action) => {
      state.chainId = action.payload;
    },
  },
});

export const {
  connectWalletRequest,
  connectWalletSuccess,
  connectWalletFailure,
  disconnectWallet,
  setProvider,
  setAccount,
  setChainId,
} = walletSlice.actions;

export default walletSlice.reducer;

// Thunks
export const connectWallet = () => async (dispatch, getState) => {
  const { ethereum } = window;
  
  if (!ethereum) {
    dispatch(connectWalletFailure('Please install MetaMask!'));
    return;
  }

  try {
    dispatch(connectWalletRequest());
    
    const provider = new ethers.providers.Web3Provider(ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    const network = await provider.getNetwork();
    
    dispatch(connectWalletSuccess({
      account: accounts[0],
      chainId: network.chainId,
      provider,
    }));
    
    // The walletMiddleware will handle the event listeners
  } catch (error) {
    console.error('Error connecting wallet:', error);
    dispatch(connectWalletFailure(error.message));
  }
};

export const disconnectWalletThunk = () => (dispatch) => {
  // In a real app, you might want to clean up any subscriptions here
  dispatch(disconnectWallet());
};
