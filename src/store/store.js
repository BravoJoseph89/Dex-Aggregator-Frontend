import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import { setupListeners } from '@reduxjs/toolkit/query';
import walletReducer from './walletSlice';
import tokensReducer from './tokensSlice';
import swapReducer from './swapSlice';

const rootReducer = combineReducers({
  wallet: walletReducer,
  tokens: tokensReducer,
  swap: swapReducer,
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

export { store };
