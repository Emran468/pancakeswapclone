import { BSC_CONFIG,BSC_TESTNET_CONFIG } from "./contracts";


export const isMetaMaskInstalled= ()=>{
    return(
     typeof window !== 'undefined' && typeof window.ethereum !== 'undefined' 
)
};

export const getNetworkConfig =(chainId)=>{
   switch(chainId){
    case "0x38":
    case 56:
        return BSC_CONFIG;
    case "0x61":
    case 97:
        return BSC_TESTNET_CONFIG;
    default:
        return BSC_CONFIG;
   }
    
};

export const switchNetwork= async(chainId)=>{
    const networkConfig=getNetworkConfig(chainId);

    try{
        await window.ethereum.request({
            method:"wallet_switchEthereumChain",
            params:[{chainId:networkConfig.chainId}],
        });
        return true;
    }catch(switchError){
        if(switchError.code===4902){
            try{
                await window.ethereum.request({
                    method:"wallet_addEthereumChain",
                    params:[networkConfig],
                });
                return true;
            }catch(addError){
                console.error("Error adding network:",addError);
                throw addError;
            }
        }else{
            console.error("Error switching network:",switchError);
            throw switchError;
        }
    }

}


 export const connectMetaMask = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed");
  }

  try {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (accounts.length === 0) {
      throw new Error("No accounts found");
    }

    const chainId = await window.ethereum.request({
      method: "eth_chainId",
    });

    return {
      account: accounts[0],
      chainId,
    };
  } catch (error) {
    console.error("Error connecting to MetaMask:", error);
    throw error;
  }
};

export const formatAddress = (address) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatNumber = (number, decimals = 4) => {
  if (!number || isNaN(number)) return "0";
  return parseFloat(number).toFixed(decimals);
};

export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return (value / total) * 100;
};

export const isValidAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};
