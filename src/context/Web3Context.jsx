// Web3Context.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { BrowserProvider } from "ethers";

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState("");
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask!");
    setLoading(true);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
      const ethersProvider = new BrowserProvider(window.ethereum);
      const signer = await ethersProvider.getSigner();
      setProvider(ethersProvider);
      setSigner(signer);
      setAccount(accounts[0]);
      setIsConnected(true);
      setChainId(currentChainId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const switchNetwork = async (newChainId) => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: newChainId }],
      });
      setChainId(newChainId);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAccount("");
        setIsConnected(false);
      } else {
        setAccount(accounts[0]);
        setIsConnected(true);
      }
    };

    const handleChainChanged = (newChainId) => {
      setChainId(newChainId);
      setProvider(new BrowserProvider(window.ethereum));
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        account,
        isConnected,
        chainId,
        connectWallet,
        switchNetwork,
        loading,
        setLoading,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

// ✅ export the hook separately at the bottom
export function useWeb3() {
  return useContext(Web3Context);
}
