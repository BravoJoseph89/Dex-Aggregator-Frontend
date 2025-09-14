import { setAccount, setChainId, disconnectWalletThunk } from '../slices/walletSlice';

export const walletMiddleware = (store) => (next) => (action) => {
  const { type } = action;
  const { dispatch } = store;
  const { ethereum } = window;

  // Set up event listeners when wallet is connected
  if (type === 'wallet/connectWalletSuccess') {
    
    // Handle account changes
    ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length > 0) {
        dispatch(setAccount(accounts[0]));
      } else {
        dispatch(disconnectWalletThunk());
      }
    });

    // Handle chain changes
    ethereum.on('chainChanged', (chainId) => {
      // Convert chainId from hex to number
      const newChainId = parseInt(chainId, 16);
      dispatch(setChainId(newChainId));
      // Refresh the page to ensure everything is up to date
      window.location.reload();
    });
  }

  return next(action);
};

export default walletMiddleware;
