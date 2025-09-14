import { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { NETWORK } from '../config';

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [account, setAccount] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize provider
    useEffect(() => {
        const init = async () => {
            if (window.ethereum) {
                try {
                    const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
                    setProvider(web3Provider);
                    
                    // Check if already connected
                    const accounts = await web3Provider.listAccounts();
                    if (accounts.length > 0) {
                        await handleAccountsChanged(accounts);
                    }
                } catch (err) {
                    console.error('Error initializing Web3 provider:', err);
                    setError(err);
                }
                
                // Set up event listeners
                window.ethereum.on('accountsChanged', handleAccountsChanged);
                window.ethereum.on('chainChanged', handleChainChanged);
            }
            setIsLoading(false);
        };

        init();

        return () => {
            if (window.ethereum?.removeListener) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, []);

    const handleAccountsChanged = async (accounts) => {
        if (!provider) return;
        
        if (accounts.length === 0) {
            // MetaMask is locked or the user has not connected any accounts
            setAccount(null);
            setSigner(null);
            setIsConnected(false);
        } else {
            try {
                const signer = provider.getSigner();
                const address = await signer.getAddress();
                setSigner(signer);
                setAccount(address);
                setIsConnected(true);
                setError(null);
                
                // Update chainId when accounts change
                const network = await provider.getNetwork();
                setChainId(network.chainId);
            } catch (error) {
                console.error('Error in handleAccountsChanged:', error);
                setError(error);
            }
        }
    };

    const handleChainChanged = () => {
        window.location.reload();
    };

    const connectWallet = async () => {
        if (!window.ethereum) {
            const error = new Error('Please install MetaMask!');
            setError(error);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            
            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
            });

            // Get the current network
            const network = await provider.getNetwork();
            setChainId(network.chainId);

            // Check if connected to the right network
            if (network.chainId !== parseInt(NETWORK.chainId, 16)) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: NETWORK.chainId }],
                    });
                } catch (switchError) {
                    // This error code indicates that the chain has not been added to MetaMask
                    if (switchError.code === 4902) {
                        setError(new Error(`Please add the network with chain ID ${NETWORK.chainId} to MetaMask`));
                    } else {
                        setError(switchError);
                    }
                    console.error('Failed to switch network:', switchError);
                    throw switchError;
                }
            }

            const signer = provider.getSigner();
            const address = await signer.getAddress();
            setSigner(signer);
            setAccount(address);
            setIsConnected(true);
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const disconnectWallet = () => {
        setAccount(null);
        setSigner(null);
        setIsConnected(false);
        setError(null);
    };

    return (
        <Web3Context.Provider
            value={{
                provider,
                signer,
                account,
                chainId,
                isConnected,
                isLoading,
                error,
                connectWallet,
                disconnectWallet,
            }}
        >
            {!isLoading ? children : <div>Loading Web3...</div>}
        </Web3Context.Provider>
    );
};

export const useWeb3 = () => {
    const context = useContext(Web3Context);
    if (context === undefined) {
        throw new Error('useWeb3 must be used within a Web3Provider');
    }
    return context;
};