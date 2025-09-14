import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  connectWallet, 
  disconnectWalletThunk
} from './store';
import { 
  fetchBalances
} from './store';
import { 
  setFromToken, 
  setToToken, 
  setAmount, 
  switchTokens, 
  executeSwap,
  clearError
} from './store';

function App() {
  const dispatch = useDispatch();
  const { isConnected, account, chainId, isLoading } = useSelector((state) => state.wallet);
  const { balances, isLoading: isLoadingBalances } = useSelector((state) => state.tokens);
  const { fromToken, toToken, amount, isSwapping, error } = useSelector((state) => state.swap);

  return (
    <div className="App" style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '1rem 2rem 2rem'
    }}>
      <header style={{ 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid #eee'
      }}>
        <h1 style={{ margin: 0, color: '#333' }}>DEX Aggregator</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isConnected && (
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              backgroundColor: '#f5f5f5',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: '0.9rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isConnected ? '#10B981' : '#EF4444'
                }} />
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <div style={{ height: '20px', width: '1px', backgroundColor: '#ddd' }} />
              <div>
                <span style={{ opacity: 0.7 }}>Address:</span>{' '}
                <span style={{ fontFamily: 'monospace' }}>
                  {`${account.substring(0, 6)}...${account.substring(38)}`}
                </span>
              </div>
              <div style={{ height: '20px', width: '1px', backgroundColor: '#ddd' }} />
              <div>
                <span style={{ opacity: 0.7 }}>Network:</span> {chainId ? `0x${chainId.toString(16)}` : 'N/A'}
              </div>
            </div>
          )}
          <WalletButton />
        </div>
      </header>
      
      <main style={{ 
        width: '100%',
        maxWidth: '1200px',
        flex: 1,
        marginTop: '0.5rem'
      }}>
        <ConnectionStatus />
      </main>
    </div>
  );
}

function WalletButton() {
  const dispatch = useDispatch();
  const { isConnected, isLoading, error } = useSelector((state) => state.wallet);

  const buttonStyle = {
    padding: '0.5rem 1rem',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: isConnected ? '#ff6b6b' : '#4CAF50',
    color: 'white',
    border: 'none',
    minWidth: '160px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease-in-out',
    ':hover': {
      opacity: 0.9,
      transform: 'translateY(-1px)'
    }
  };


  const handleConnect = () => {
    if (isConnected) {
      dispatch(disconnectWalletThunk());
    } else {
      dispatch(connectWallet());
    }
  };

  return (
    <div>
      <button 
        onClick={handleConnect}
        disabled={isLoading}
        style={{
          ...buttonStyle,
          backgroundColor: isLoading ? '#666' : (isConnected ? '#ef4444' : '#3b82f6'),
          opacity: isLoading ? 0.7 : 1,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          minWidth: '140px',
          padding: '0.5rem 1.5rem'
        }}
      >
        {isLoading ? (
          <>
            <span className="spinner"></span>
            {isConnected ? 'Disconnecting...' : 'Connecting...'}
          </>
        ) : isConnected ? (
          'Disconnect'
        ) : (
          'Connect Wallet'
        )}
      </button>
      {error && (
        <div style={{ color: '#ef4444', marginTop: '0.5rem', fontSize: '0.8rem' }}>
          {error}
        </div>
      )}
    </div>
  );
}

function ConnectionStatus() {
  const dispatch = useDispatch();
  const { isConnected, account, chainId } = useSelector((state) => state.wallet);
  const { balances, isLoading: isLoadingBalances } = useSelector((state) => state.tokens);
  const { 
    fromToken, 
    toToken, 
    amount, 
    isSwapping, 
    error: swapError, 
    priceImpact, 
    exchangeRate 
  } = useSelector((state) => state.swap);
  
  useEffect(() => {
    if (isConnected) {
      dispatch(fetchBalances());
    }
  }, [isConnected, dispatch]);
  
  const validateAmount = (value) => {
    if (value === '') return ''; // Allow empty input
    const num = parseFloat(value);
    if (isNaN(num)) return 'Please enter a valid number';
    if (num <= 0) return 'Amount must be greater than 0';
    if (balances[fromToken] && num > parseFloat(balances[fromToken])) {
      return 'Insufficient balance';
    }
    return '';
  };
  
  const handleAmountChange = (value) => {
    dispatch(setAmount(value));
    const validationError = validateAmount(value);
    if (validationError) {
      dispatch(clearError());
    }
  };
  
  const handleSwap = () => {
    if (!amount) return;
    const validationError = validateAmount(amount);
    if (validationError) {
      // Set error in Redux state
      dispatch(clearError());
      return;
    }
    dispatch(executeSwap());
  };
  
  const handleSwitchTokens = () => {
    dispatch(switchTokens());
  };
  
  const isFormValid = amount && !validateAmount(amount) && !isSwapping;

  // Fetch token balances when account changes
  useEffect(() => {
    if (isConnected) {
      dispatch(fetchBalances());
    }
  }, [isConnected, account, dispatch]);

  if (!isConnected) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Welcome to DEX Aggregator</h2>
        <p>Connect your wallet to start trading</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3>Token Balances</h3>
        {isLoadingBalances ? (
          <p>Loading balances...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {Object.entries(balances).map(([symbol, balance]) => (
              <div key={symbol} style={{ 
                padding: '1rem', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{symbol}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{balance}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Swap Tokens</h3>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>From:</label>
          <div style={{ 
            display: 'flex', 
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <input
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              min="0"
              step="0.000000000000000001"
              placeholder="0.0"
              style={{ 
                flex: 1, 
                padding: '0.75rem', 
                borderRadius: '8px', 
                border: '1px solid #ddd',
                fontSize: '1rem'
              }}
            />
            <select
              value={fromToken}
              onChange={(e) => dispatch(setFromToken(e.target.value))}
              style={{ 
                padding: '0 1rem', 
                borderRadius: '8px', 
                border: '1px solid #ddd',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="SEFI">SEFI</option>
              <option value="CHLOE">CHLOE</option>
              <option value="ZOE">ZOE</option>
              <option value="MAGGIE">MAGGIE</option>
            </select>
          </div>

          <div 
            style={{ 
              textAlign: 'center', 
              margin: '0.5rem 0',
              fontSize: '1.5rem',
              cursor: 'pointer',
              ':hover': {
                color: '#3b82f6',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
            onClick={handleSwitchTokens}
            title="Switch tokens"
          >
            ↓
          </div>

          <label style={{ display: 'block', marginBottom: '0.5rem' }}>To:</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input
              type="text"
              value={amount ? (parseFloat(amount) * exchangeRate).toFixed(4) : '0.0'}
              disabled
              style={{ 
                flex: 1, 
                padding: '0.75rem', 
                borderRadius: '8px', 
                border: '1px solid #ddd',
                backgroundColor: '#f8f9fa',
                fontSize: '1rem'
              }}
            />
            <select
              value={toToken}
              onChange={(e) => dispatch(setToToken(e.target.value))}
              style={{ 
                padding: '0 1rem', 
                borderRadius: '8px', 
                border: '1px solid #ddd',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="SEFI">SEFI</option>
              <option value="CHLOE">CHLOE</option>
              <option value="ZOE">ZOE</option>
              <option value="MAGGIE">MAGGIE</option>
            </select>
          </div>

          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            backgroundColor: '#f0f9ff',
            borderRadius: '8px',
            fontSize: '0.9rem'
          }}>
            <p>Price: 1 {fromToken} = {exchangeRate} {toToken}</p>
            <p>Minimum received: {amount ? (amount * exchangeRate).toFixed(4) : '0.0000'} {toToken}</p>
            <p>Price impact: {priceImpact}%</p>
          </div>

          {swapError && (
            <div style={{ color: '#ef4444', marginTop: '0.5rem' }}>
              {swapError}
            </div>
          )}
          <button
            onClick={handleSwap}
            disabled={!isFormValid}
            style={{
              width: '100%',
              marginTop: '1.5rem',
              padding: '1rem',
              fontSize: '1.1rem',
              backgroundColor: isFormValid ? '#4CAF50' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isFormValid ? 'pointer' : 'not-allowed',
              opacity: isFormValid ? 1 : 0.7,
              transition: 'all 0.2s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {isSwapping ? (
              <>
                <span className="spinner"></span>
                Swapping...
              </>
            ) : (
              'Swap'
            )}
          </button>
          {swapError && (
            <div style={{ color: '#ef4444', marginTop: '0.5rem', textAlign: 'center' }}>
              {swapError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;