import React, { useState, useEffect, useContext, createContext } from 'react';
import { useAccount, useConnect, useDisconnect, useNetwork, useSwitchNetwork } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { ethers, JsonRpcProvider } from 'ethers';

import factoryAbi from '@/Contract/factoryAbi.json';
import stakingAbi2 from '@/Contract/stakingAbi2.json';
import erc20Abi from '@/Contract/erc20Abi.json';
import approveAbi from '@/Contract/approve.json';
import toast from 'react-hot-toast';
import { ConvertToEpochDuration } from '@/lib/helper';
import { metaMask } from 'wagmi/connectors'

// import axios from 'axios';

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
   // const factoryContractAddress = "0x0B440864fe9f47da44E45A193012a60dD73d8062"
   const factoryContractAddress = "0xaf2e951d9a4BF8d74e594eA8f10D04c58314d520"


   /// state variables
   const [createdShibbase, setCreatedShibbase] = useState([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isCreating, setIsCreating] = useState(false);
   const [isApproving, setIsApproving] = useState(false);



   const alchemyApiKey = 'https://base-sepolia.g.alchemy.com/v2/k876etRLMsoIcTpTzkkTuh3LPBTK96YZ';
   // const provider = new ethers.getDefaultProvider(alchemyApiKey);



   // useEffect(() => {
   //    let isMounted = true;

   //    const fetchFactory = async () => {
   //       try {
   //          setIsLoading(true);

   //          // Create provider
   //          const provider = new ethers.JsonRpcProvider(alchemyApiKey);

   //          // Create contract instance
   //          const contractInstance = new ethers.Contract(
   //             factoryContractAddress,
   //             factoryAbi,
   //             provider
   //          );

   //          // Get all created networks
   //          const getAllCreatedShibbase = await contractInstance.getAllCreatedShibbase();

   //          if (!isMounted) return;

   //          if (!getAllCreatedShibbase || getAllCreatedShibbase.length === 0) {
   //             setCreatedShibbase([]);
   //             setIsLoading(false);
   //             return;
   //          }

   //          const networkDetails = await Promise.all(
   //             getAllCreatedShibbase.map(async (addr) => {
   //                try {
   //                   const createdShibbase4Address = new ethers.Contract(
   //                      addr,
   //                      stakingAbi2,
   //                      provider
   //                   );

   //                   const [
   //                      aprInSmallestUnits,
   //                      totalStake,
   //                      totalStaker,
   //                      tokens
   //                   ] = await Promise.all([
   //                      createdShibbase4Address.RATE(),
   //                      createdShibbase4Address.totalStaking(),
   //                      createdShibbase4Address.totalStaker(),
   //                      createdShibbase4Address.token()
   //                   ]);

   //                   const erc20Tokens = new ethers.Contract(tokens, erc20Abi, provider);
   //                   const [name, symbol] = await Promise.all([
   //                      erc20Tokens.name(),
   //                      erc20Tokens.symbol()
   //                   ]);

   //                   return {
   //                      shibAddress: addr,
   //                      apr: ethers.formatEther(aprInSmallestUnits),
   //                      totalStake: ethers.formatEther(totalStake),
   //                      totalStaker: totalStaker.toString(),
   //                      tokens,
   //                      name,
   //                      symbol
   //                   };
   //                } catch (error) {
   //                   console.error(`Error fetching details for address ${addr}:`, error);
   //                   return null;
   //                }
   //             })
   //          );

   //          if (!isMounted) return;

   //          // Filter out any null values from failed fetches
   //          const validNetworks = networkDetails.filter(network => network !== null);
   //          setCreatedShibbase(validNetworks);
   //       } catch (error) {
   //          console.error('Error fetching factory data:', error);
   //          toast.error('Failed to fetch networks');
   //       } finally {
   //          if (isMounted) {
   //             setIsLoading(false);
   //          }
   //       }
   //    };

   //    fetchFactory();

   //    return () => {
   //       isMounted = false;
   //    };
   // }, []);


   // Approve Logic


   const approveToken = async (tokenAddress, amount) => {
      try {
         setIsApproving(true);
         if (!window.ethereum) throw new Error('MetaMask is not detected.');

         const provider = new ethers.BrowserProvider(window.ethereum);
         const signer = await provider.getSigner();

         const tokenContract = new ethers.Contract(tokenAddress, approveAbi, signer);
         const approveTx = await tokenContract.approve(factoryContractAddress, amount);

         console.log("Approval transaction sent:", approveTx.hash);
         await approveTx.wait(); // Wait for the transaction to be mined
         console.log("Approval confirmed");
         toast.success("Token approval successful!");
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

         // Check if MetaMask is installed
         if (!window.ethereum.isMetaMask) {
            throw new Error('MetaMask is not detected. Please install MetaMask.');
         }

         // const provider = new JsonRpcProvider("https://base-sepolia.g.alchemy.com/v2/v4I8JjwzP0ryByaiMVKHsu7ci6UlDPfm");

         const provider = new ethers.BrowserProvider(window.ethereum);
         // Prompt connection if not already connected
         try {
            // Check if the user is already connected to a wallet
            const accounts = await provider.send("eth_accounts", []);
            console.log(accounts)
            if (accounts.length === 0) {
               // If no accounts are found, prompt the user to connect their wallet
               await provider.send("eth_requestAccounts", []);
            }
         } catch (connectionError) {
            throw new Error("Wallet connection rejected by user.");
         }

         const signer = await provider.getSigner();

         console.log(signer, "signer")



         const factoryContract = new ethers.Contract(
            factoryContractAddress,
            factoryAbi,
            signer
         );

         console.log(factoryContract)

         // if (!ethers.isAddress(tokenAddress)) {
         //    throw new Error('Invalid token address');
         // }

         const minStakeInWei = ethers.parseEther(minimumStake.toString());
         const aprInWei = ethers.parseUnits(apr.toString(), 18);
         const stakeDuration = BigInt(ConvertToEpochDuration(duration));

         console.log({
            tokenAddress,
            minStakeInWei: minStakeInWei.toString(),
            aprInWei: aprInWei.toString(),
            stakeDuration
         }, "stake pool console");




         // Call approve logic before creating the stake
         const approvalSuccess = await approveToken(tokenAddress, minStakeInWei);
         if (!approvalSuccess) throw new Error("Approval failed. Stake creation aborted.");


         console.log("Approval transaction sent:", approvalSuccess.hash);
         await approvalSuccess.wait(); // Wait for the approval transaction to be mined
         console.log("Approval confirmed");


         // Estimate gas first
         const gasEstimate = await factoryContract.createStake.estimateGas(
            tokenAddress,
            minStakeInWei,
            aprInWei,
            stakeDuration
         );

         // Add 20% buffer to gas estimate
         // Convert gasEstimate to number before multiplication since it's returned as BigInt
         const gasLimit = BigInt(Math.floor(Number(gasEstimate) * 1.2));

         const tx = await factoryContract.createStake(
            tokenAddress,
            minStakeInWei,
            aprInWei,
            stakeDuration,
            { gasLimit: gasLimit }
         );

         const receipt = await tx.wait();
         console.log("Stake created successfully:", receipt.hash);
         toast.success("Stake created successfully!");

      } catch (error) {
         console.error('Stake Creation Error:', error);
         throw error;
      } finally {
         setIsCreating(false);
      }
   };


   // 0x201af0e0243415B67A0D6CD1f6fCd50666bB1a6E


   // const CreateStake = async () => {
   //    const { tokenAddress, minimumStake, apr, duration } = stakeParams;

   //    try {
   //       setIsCreating(true);

   //       if (!window.ethereum) {
   //          throw new Error('No Ethereum wallet detected.');
   //       }

   //       const provider = new ethers.BrowserProvider(window.ethereum);
   //       const signer = await provider.getSigner();

   //       const factoryContract = new ethers.Contract(factoryContractAddress, factoryAbi, signer);

   //       if (!ethers.isAddress(tokenAddress)) {
   //          throw new Error('Invalid token address');
   //       }

   //       const minStakeInWei = ethers.parseEther(minimumStake.toString());
   //       const aprInWei = ethers.parseUnits(apr.toString(), 18);
   //       const stakeDuration = ConvertToEpochDuration(duration) // Convert days to seconds

   //       console.log({ tokenAddress, minStakeInWei, aprInWei, stakeDuration }, " input from user");

   //       const tx = await factoryContract.createStake(tokenAddress, minStakeInWei, aprInWei, stakeDuration);
   //       console.log(tx, "stake transaction created");

   //       const receipt = await tx.wait();
   //       const stakeCreatedEvent = receipt.logs.find(log => log.fragment && log.fragment.name === 'ShibaseStakeCreated');

   //       if (!stakeCreatedEvent) {
   //          throw new Error('Stake creation event not found');
   //       }

   //       const newStakeAddress = stakeCreatedEvent.args[0];
   //       toast.success('Stake created successfully!');

   //       return { success: true, stakeAddress: newStakeAddress, transactionHash: receipt.hash };
   //    } catch (error) {
   //       console.error('Stake Creation Error:', error);
   //       toast.error('Stake creation failed: ' + error.message);
   //       return { success: false, error: error.message };
   //    } finally {
   //       setIsCreating(false);
   //    }
   // };


   // useEffect(() => {
   //    const provider = new ethers.providers.Web3Provider(window.ethereum);
   //    const contract = new ethers.Contract(
   //       STAKE_FACTORY_ADDRESS,
   //       ShibaseStakeFactoryABI,
   //       provider
   //    );

   //    const handleStakeCreated = (
   //       shibaseStake,
   //       owner,
   //       apr,
   //       duration,
   //       min,
   //       token
   //    ) => {
   //       console.log("New Stake Created:", shibaseStake);
   //       setCreatedShibbase((prev) => [
   //          ...prev,
   //          {
   //             shibAddress: shibaseStake,
   //             name: "New Stake", // Add more details if required
   //             apr,
   //             totalStake: 0, // Initialize or fetch actual data
   //             totalStaker: 0, // Initialize or fetch actual data
   //             tokens: token,
   //          },
   //       ]);
   //    };

   //    // Listen for the ShibaseStakeCreated event
   //    contract.on("ShibaseStakeCreated", handleStakeCreated);

   //    setIsLoading(false);

   //    // Cleanup the event listener when the component unmounts
   //    return () => {
   //       contract.off("ShibaseStakeCreated", handleStakeCreated);
   //    };
   // }, []);



   return (
      <StakingContext.Provider
         value={{
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
            connect
         }}
      >
         {children}
      </StakingContext.Provider>
   );
};
