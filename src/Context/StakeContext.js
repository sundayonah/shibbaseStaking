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



   // useEffect(() => {
   //    let isMounted = true;

   //    const fetchFactory = async () => {
   //       try {
   //          setIsLoading(true);

   //          // Create provider
   //          const provider = new ethers.JsonRpcProvider(alchemyApiKey);

   //          // Create contract instance
   //          const contractInstance = new ethers.Contract(
   //             shibaseContractAddress,
   //             shibaseAbi,
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
         const approveTx = await tokenContract.approve(shibaseContractAddress, amount);

         console.log("Approval transaction sent:", approveTx.hash);
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

         console.log("Converted Inputs:", {
            tokenAddress: tokenAddress,
            minStakeInWei: minStakeInWei.toString(),
            aprInWei: aprInWei.toString(),
            stakeDuration: stakeDuration.toString()
         });

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
         console.log("Transaction receipt logs:", receipt.logs);

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

         console.log("Stake created successfully:", receipt.hash, "Stake Address:", stakeAddress);

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


   useEffect(() => {
      const fetchNetworkDetails = async () => {
         setIsLoading(true);

         const erc20Tokens = new ethers.Contract("0x7896F3Ab059fa874F6089EE6970bfE3D6D4F9AC2", erc20Abi, provider);
         const [name, symbol] = await Promise.all([
            erc20Tokens.name(),
            erc20Tokens.symbol()
         ]);
         console.log({ name, symbol }, "///////////// token details")

         // return {
         //    // shibAddress: addr,
         //    // apr: ethers.formatEther(aprInSmallestUnits),
         //    // totalStake: ethers.formatEther(totalStake),
         //    // totalStaker: totalStaker.toString(),
         //    // tokens,
         //    name,
         //    symbol
         // };
      };

      fetchNetworkDetails

      // setCreatedShibbase(networkDetails);
   }, []);




   // const fetchPastStakes = async () => {
   //    try {
   //       // const provider = new ethers.BrowserProvider(window.ethereum);
   //       const factoryContract = new ethers.Contract(shibaseContractAddress, shibaseAbi, provider);
   //       const erc20Tokens = new ethers.Contract(token, erc20Abi, provider);

   //       const filter = factoryContract.filters.ShibaseStakeCreated();
   //       const events = await factoryContract.queryFilter(filter, "earliest", "latest");
   //       console.log(events, "events")

   //       console.log("RPC Request:", {
   //          address: shibaseContractAddress,
   //          topics: filter.topics,
   //          fromBlock: "0x0",
   //          toBlock: "latest"
   //       });



   //       const [name, symbol] = await Promise.all([
   //          erc20Tokens.name(),
   //          erc20Tokens.symbol()
   //       ]);


   //       // console.log({ name, symbol }, "token details")


   //       if (!events.length) {
   //          console.warn("No stakes found for the current filter.");
   //          return [];
   //       }

   //       return events.map(event => ({
   //          shibaseStake: event.args.shibaseStake,
   //          owner: event.args.owner,
   //          apr: event.args.apr.toString(),
   //          duration: event.args.duration.toString(),
   //          min: ethers.formatEther(event.args.min),
   //          token: event.args.token,
   //       }));
   //    } catch (error) {
   //       console.error("Error fetching past stakes:", error);
   //       return [];
   //    }
   // };

   const fetchPastStakes = async () => {
      try {
         const factoryContract = new ethers.Contract(shibaseContractAddress, shibaseAbi, provider);

         const filter = factoryContract.filters.ShibaseStakeCreated();
         const events = await factoryContract.queryFilter(filter, "earliest", "latest");

         console.log({ events }, "events");

         console.log("RPC Request:", {
            address: shibaseContractAddress,
            topics: filter.topics,
            fromBlock: "0x0",
            toBlock: "latest"
         });

         if (events.length === 0) {
            console.warn("No stakes found for the current filter.");
            return [];
         }




         // const tokenDetailsPromises = events.map(event => {
         //    return Promise.all([
         //       new ethers.Contract(event.args.token, erc20Abi, provider).name(),
         //       new ethers.Contract(event.args.token, erc20Abi, provider).symbol()
         //    ]);
         // });

         // const [tokenNames, tokenSymbols] = await Promise.all(tokenDetailsPromises);

         // console.log({ tokenNames, tokenSymbols }, "token details");

         return events.map((event, index) => ({
            shibaseStake: event.args.shibaseStake,
            owner: event.args.owner,
            apr: event.args.apr.toString(),
            duration: event.args.duration.toString(),
            min: ethers.formatEther(event.args.min),
            // tokenName: tokenNames[index][0],
            // tokenSymbol: tokenSymbols[index][0],
            token: event.args.token
         }));
      } catch (error) {
         console.error("Error fetching past stakes:", error);
         return [];
      }
   };


   const listenForNewStakes = () => {
      const provider = new ethers.BrowserProvider(window.ethereum);


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

         console.log("New Stake Created:", newStake);
         // Add this stake to your application's state
      });


   };

   useEffect(() => {
      // const provider = new ethers.BrowserProvider(window.ethereum);

      const factoryContract = new ethers.Contract(
         shibaseContractAddress,
         shibaseAbi,
         provider
      );
      const initialize = async () => {
         const pastStakes = await fetchPastStakes();
         console.log(pastStakes, "Fetched past")
         // pastStakes.forEach(stake => {
         //    console.log(`Token Name: ${stake.tokenName}, Symbol: ${stake.tokenSymbol}`);
         //    console.log(`Token Address: ${stake.tokenAddress}`);
         //    console.log(`Stake Address: ${stake.shibaseStake}`);
         // });
         setCreatedShibbase(pastStakes);

         const logs = await provider.getLogs({
            address: '0xaf2e951d9a4BF8d74e594eA8f10D04c58314d520',
            fromBlock: '0x0',
            toBlock: 'latest',
         });
         console.log("Logs:", logs);


         listenForNewStakes();
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
            connect
         }}
      >
         {children}
      </StakingContext.Provider>
   );
};
