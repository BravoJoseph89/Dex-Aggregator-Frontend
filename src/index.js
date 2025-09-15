import React, { Component } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { Web3ReactProvider } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import store from './store';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Create a Web3Provider instance
function getLibrary(provider) {
  try {
    const library = new Web3Provider(provider, 'any');
    library.pollingInterval = 15000; // Poll every 15 seconds
    return library;
  } catch (error) {
    console.error('Error creating Web3Provider:', error);
    throw error;
  }
}

// Error boundary for the application
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '2rem', 
          fontFamily: 'sans-serif',
          maxWidth: '800px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <h2>Something went wrong</h2>
          <pre style={{ 
            textAlign: 'left',
            backgroundColor: '#f8f8f8',
            padding: '1rem',
            borderRadius: '4px',
            overflowX: 'auto'
          }}>
            {this.state.error?.message || 'Unknown error occurred'}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simple wrapper to handle Web3React provider errors
function Web3Wrapper({ children }) {
  try {
    return (
      <Web3ReactProvider getLibrary={getLibrary}>
        {children}
      </Web3ReactProvider>
    );
  } catch (error) {
    console.error('Error initializing Web3React:', error);
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Failed to initialize Web3</h2>
        <p>Please make sure you have MetaMask or another Web3 wallet installed.</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Web3Wrapper>
        <Provider store={store}>
          <App />
        </Provider>
      </Web3Wrapper>
    </ErrorBoundary>
  </React.StrictMode>
);

reportWebVitals();