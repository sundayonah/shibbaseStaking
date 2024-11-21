import React, { useState, useEffect, createContext, useRef } from 'react';
import { useAccount, useConnect, useDisconnect, useNetwork, useSwitchNetwork } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { ethers } from 'ethers';

import shibaseAbi from '@/Contract/shibaseAbi.json';
import erc20Abi from '@/Contract/erc20Abi.json';
import approveAbi from '@/Contract/approve.json';
import toast from 'react-hot-toast';
import { ConvertToEpochDuration } from '@/lib/helper';

export const StakingContext = createContext({});

export const StakingContextProvider = ({ children }) => {
   const [stakeParams, setStakeParams] = useState({
      tokenAddress: '',
      minimumStake: '',
      apr: '',
      duration: '',
   });

   const { address, isConnected } = useAccount();
   const { connect } = useConnect({
      connector: new InjectedConnector(),
   });

   const { chain } = useNetwork();
   const { switchNetwork } = useSwitchNetwork();
   // Base Sepolia testnet
   const REQUIRED_CHAIN_ID = 84532;


   // testnet
   // const shibaseContractAddress = "0x0B440864fe9f47da44E45A193012a60dD73d8062"
   const shibaseContractAddress = "0xaf2e951d9a4BF8d74e594eA8f10D04c58314d520"

   const subscriptionRef = useRef();


   /// state variables
   const [createdShibbase, setCreatedShibbase] = useState([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isCreating, setIsCreating] = useState(false);
   const [isApproving, setIsApproving] = useState(false);





   const alchemyApiKey = 'https://base-sepolia.g.alchemy.com/v2/k876etRLMsoIcTpTzkkTuh3LPBTK96YZ';

   const provider = new ethers.getDefaultProvider(alchemyApiKey);


   // const getContractInstance = async () => {
   //    if (typeof window !== "undefined" && window.ethereum) {
   //       signer = await provider.getSigner();
   //       contractInstance = new ethers.Contract(shibaseContractAddress, shibaseAbi, signer);
   //       return contractInstance;
   //    } else {
   //       throw new Error("Ethereum wallet not found. Please install MetaMask.");
   //    }
   // };



   // Approve Logic


   const approveToken = async (tokenAddress, amount) => {
      try {
         setIsApproving(true);
         if (!window.ethereum) throw new Error('MetaMask is not detected.');

         const signer = await provider.getSigner();

         const tokenContract = new ethers.Contract(tokenAddress, approveAbi, signer);
         const approveTx = await tokenContract.approve(shibaseContractAddress, amount);

         await approveTx.wait(); // Wait for the transaction to be mined
         console.log("Approval confirmed");

         toast.success("Token is approved for staking!");
         return true;
      } catch (error) {
         console.error('Approval Error:', error);
         toast.error("Token approval failed. Please try again.");
         return false;
      } finally {
         setIsApproving(false);
      }
   };

   const CreateStake = async () => {
      const { tokenAddress, minimumStake, apr, duration } = stakeParams;

      try {
         setIsCreating(true);

         // Validate inputs
         if (!tokenAddress || !minimumStake || !apr || !duration) {
            toast.error("Please fill all stake parameters.");
            return false;
         }

         // Check if MetaMask is installed
         if (!window.ethereum?.isMetaMask) {
            throw new Error('MetaMask is not detected. Please install MetaMask.');
         }

         const provider = new ethers.BrowserProvider(window.ethereum);

         // Ensure wallet is connected
         const accounts = await provider.send("eth_accounts", []);
         if (accounts.length === 0) {
            await provider.send("eth_requestAccounts", []);
         }

         const signer = await provider.getSigner();

         const contractInstance = new ethers.Contract(
            shibaseContractAddress,
            shibaseAbi,
            signer
         );



         // Validate token address
         if (!ethers.isAddress(tokenAddress)) {
            throw new Error('Invalid token address');
         }

         // Convert inputs to appropriate formats
         const minStakeInWei = ethers.parseEther(minimumStake.toString());
         const aprInWei = ethers.parseUnits(apr.toString(), 18);
         const stakeDuration = ConvertToEpochDuration(duration);

         // // Check if protocol fees are enabled and get the fee
         // const protocolFee = await contractInstance.protocolFees();
         // // if (protocolFee > 0) {
         // console.log("Protocol Fee:", protocolFee.toString());
         // // }

         // Estimate gas for stake creation
         const gasEstimate = await contractInstance.createStake.estimateGas(
            tokenAddress,
            minStakeInWei,
            apr,
            stakeDuration,
            // { value: protocolFee } // Send protocol fee along with the transaction
         );

         // Add 20% buffer to gas estimate
         const gasLimit = BigInt(Math.floor(Number(gasEstimate) * 1.2));

         // Create stake (sending the protocol fee as value)
         const tx = await contractInstance.createStake(
            tokenAddress,
            minStakeInWei,
            apr,
            stakeDuration,
            { gasLimit: gasLimit }
         );

         const receipt = await tx.wait();

         // After transaction
         console.log("Full Transaction Details:", {
            hash: receipt.hash,
            from: receipt.from,
            to: receipt.to,
            logs: receipt.logs,
            status: receipt.status
         });

         // Decode the logs
         const iface = new ethers.Interface(shibaseAbi);
         let stakeAddress = null

         if (receipt.logs.length === 0) {
            console.error("No logs found in the transaction receipt");
         }

         for (const log of receipt.logs) {
            try {
               console.log("Raw Log:", log);
               const parsedLog = iface.parseLog(log);
               console.log("Parsed Log Details:", {
                  name: parsedLog.name,
                  args: parsedLog.args
               });

               if (parsedLog.name === "ShibaseStakeCreated") {
                  stakeAddress = parsedLog.args.shibaseStake;
                  console.log("Found Stake Address:", stakeAddress);
                  break;
               }
            } catch (err) {
               console.warn("Log parsing failed:", err);
            }
         }


         toast.success("Stake created successfully!");

         return {
            stakeAddress,
            transactionHash: receipt.hash,
         };
      } catch (error) {
         console.error('Stake Creation Error:', error);
         toast.error(error.message || "Failed to create stake");
         return false;
      } finally {
         setIsCreating(false);
      }
   };

   const fetchPastStakesWithDetails = async () => {
      try {
         // add loading
         const alchemyApiKey = 'https://base-sepolia.g.alchemy.com/v2/k876etRLMsoIcTpTzkkTuh3LPBTK96YZ';

         const provider = new ethers.getDefaultProvider(alchemyApiKey);

         const factoryContract = new ethers.Contract(shibaseContractAddress, shibaseAbi, provider);

         const filter = factoryContract.filters.ShibaseStakeCreated();
         const events = await factoryContract.queryFilter(filter, "earliest", "latest");

         if (events.length === 0) {
            console.warn("No stakes found for the current filter.");
            return [];
         }

         // Use Promise.all to fetch details for all stakes concurrently
         const stakesWithDetails = await Promise.all(events.map(async (event) => {
            const shibaseStakeAddress = event.args.shibaseStake;

            // Create a contract instance for the specific ShibaseStake
            const shibaseStakeContract = new ethers.Contract(
               shibaseStakeAddress,
               [
                  "function vaultInfo() external view returns (tuple(uint256 totalStaked, uint256 totalStaker, uint256 minimumStakeAmount, uint256 ENTRY_RATE, uint256 duration, address TOKEN, address owner, address factory))"

               ],
               provider
            );

            try {
               // Fetch vault information
               const vaultInfo = await shibaseStakeContract.vaultInfo();

               return {
                  shibaseStake: shibaseStakeAddress,
                  name: `Stake ${shibaseStakeAddress.slice(0, 6)}`,
                  symbol: 'TOKEN',
                  owner: event.args.owner,
                  apr: event.args.apr.toString(),
                  duration: event.args.duration.toString(),
                  min: ethers.formatEther(event.args.min),
                  token: event.args.token,
                  // Additional details from vaultInfo
                  totalStaked: ethers.formatEther(vaultInfo.totalStaked),
                  totalStaker: vaultInfo.totalStaker.toString(),
                  minimumStakeAmount: ethers.formatEther(vaultInfo.minimumStakeAmount),
                  entryRate: vaultInfo.ENTRY_RATE.toString()
               };
            } catch (error) {
               console.error(`Error fetching details for ${shibaseStakeAddress}:`, error);
               return null;
            }
         }));

         // Filter out any null results
         return stakesWithDetails.filter(stake => stake !== null);

      } catch (error) {
         console.error("Error fetching past stakes:", error);
         return [];
      }
   };





   const listenForNewStakes = () => {
      const alchemyApiKey = 'https://base-sepolia.g.alchemy.com/v2/k876etRLMsoIcTpTzkkTuh3LPBTK96YZ';
      const provider = new ethers.getDefaultProvider(alchemyApiKey);



      const factoryContract = new ethers.Contract(
         shibaseContractAddress,
         shibaseAbi,
         provider
      );
      factoryContract.on("ShibaseStakeCreated", (shibaseStake, owner, apr, duration, min, token) => {
         const newStake = {
            shibaseStake,
            owner,
            apr: apr.toString(),
            duration: duration.toString(),
            min: ethers.utils.formatEther(min),
            token,
         };

         // Add this stake to your application's state
      });


   };

   useEffect(() => {
      // const provider = new ethers.BrowserProvider(window.ethereum);
      const alchemyApiKey = 'https://base-sepolia.g.alchemy.com/v2/k876etRLMsoIcTpTzkkTuh3LPBTK96YZ';

      const provider = new ethers.getDefaultProvider(alchemyApiKey);


      const factoryContract = new ethers.Contract(
         shibaseContractAddress,
         shibaseAbi,
         provider
      );
      const initialize = async () => {
         setIsLoading(true);

         const pastStakes = await fetchPastStakesWithDetails();
         setCreatedShibbase(pastStakes);

         await provider.getLogs({
            address: shibaseContractAddress,
            fromBlock: '0x0',
            toBlock: 'latest',
         });


         listenForNewStakes();
         setIsLoading(false);
      };

      initialize();

      return () => {
         // Clean up event listener when component unmounts
         factoryContract.removeAllListeners("ShibaseStakeCreated");
      };
   }, []);




   // 0x201af0e0243415B67A0D6CD1f6fCd50666bB1a6E


   return (
      <StakingContext.Provider
         value={{
            shibaseContractAddress,
            shibaseAbi,
            isApproving,
            approveToken,
            stakeParams,
            setStakeParams,
            CreateStake,
            isCreating,
            isLoading,
            createdShibbase,
            isConnected,
            address,
            connect,
            provider
         }}
      >
         {children}
      </StakingContext.Provider>
   );
};
