import React, { useContext, useEffect, useState } from 'react';
import { StakingContext } from '@/Context/StakeContext';
import toast, { Toaster } from 'react-hot-toast';
import { useAccount } from 'wagmi';
import { Loading } from './Loading';
import stakingAbi2 from '@/Contract/stakingAbi2.json';
import approveAbi from '@/Contract/approve.json';
import { ethers } from 'ethers';
import Image from 'next/image';
import AOS from 'aos';
import 'aos/dist/aos.css';


const SingleNetwork = ({ shibAddress, token }) => {

   const {
      calculateReward,
      ethBalance,
      createdShibbase,
   } = useContext(StakingContext);

   const { address } = useAccount();

   const [stakeButtonState, setStakeButtonState] = useState('Stake');
   const [stakeLoading, setStakeLoading] = useState(false);
   const [stakeAmount, setStakeAmount] = useState('');
   const [approvedLoading, setApprovedLoading] = useState(false);
   const [isApproved, setIsApproved] = useState(false);
   const [unStakeLoading, setUnStakeLoading] = useState(false);
   const [maxBalance, setMaxBalance] = useState('');
   const [noProfitYet, setNoProfitYet] = useState(false);
   const [profitLoading, setProfitLoading] = useState(false);
   const [claimLoading, setClaimLoading] = useState(false);


   // Find the specific network details
   const findNetworkDetails = createdShibbase.find(network => network.shibaseStake === shibAddress);

   ///// CLAIM F(x) ///////////
   const Claim = async () => {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
         shibAddress,
         stakingAbi2,
         signer
      );

      // const contract = await getContract();

      if (address === undefined) {
         toast.success(`Please Connect Your Wallet.`, {
            duration: 4000,
            position: 'top-right',
            icon: '❌',
            style: {
               color: '#fff',
               background: `linear-gradient(to right, #000f58, #000624)`,
            },
         });
         return;
      }

      // calculate profitPool
      // const profitPool1 = await calculateRewards(shibAddress, token);
      // console.log(profitPool1, " profit /////////////////")

      const profitPool = 2

      setClaimLoading(true);

      setNoProfitYet(false);
      // setStakeLoading(true);
      try {
         let tx;
         if (profitPool == 0) {

            setNoProfitYet(true);
            setTimeout(() => {
               setNoProfitYet(false);
            }, 3000);
         } else {
            setNoProfitYet(false);
            setProfitLoading(true);
            tx = await contract.unStake(0, {
               gasLimit: 1000000,
               gasPrice: ethers.parseUnits('15.0', 'gwei'),
            });
            const receipt = await tx.wait();
            if (receipt.status == 1) {
               setClaimLoading(false);

               setProfitLoading(false);
               // Reload the page after a successful transaction
               window.location.reload();
            } else {
               setProfitLoading(false);
               setClaimLoading(false);
            }
         }
      } catch (err) {
         console.error(err);
      }
      // setStakeLoading(false);
      setClaimLoading(false);
   };

   const handleMaxButtonClick = async () => {
      try {
         if (address === undefined) {
            toast.success(`Please Connect Your Wallet.`, {
               duration: 4000,
               position: 'top-right',
               icon: '❌',
               style: {
                  color: '#fff',
                  background: `linear-gradient(to right, #000f58, #000624)`,
                  // border: '1px solid #a16206',
               },
            });
            return;
         }
         console.log("/////////////////")


         // const signer = await provider.getSigner();

         const provider = new ethers.BrowserProvider(window.ethereum);

         const contractInstance = new ethers.Contract(
            token,
            approveAbi,
            provider
         );

         const balance = await contractInstance.balanceOf(address);
         console.log(balance, "balance")


         const stringBalance = ethers.formatEther(balance.toString());
         console.log(stringBalance, "stringBalance")

         const formattedBalance = parseFloat(stringBalance).toFixed(3);


         setMaxBalance(formattedBalance);
         setStakeAmount(formattedBalance);
      } catch (error) {
         console.error('Error fetching balance:', error);
      }
   };

   const handleChange = async (e) => {
      setStakeAmount(e.target.value);
   };

   ///// STAKE F(x) ///////////
   const Stake = async () => {
      setStakeLoading(true);
      try {
         // const contract = await getContract();

         const provider = new ethers.BrowserProvider(window.ethereum);

         const signer = await provider.getSigner();
         const createdShibbaseInstance = new ethers.Contract(
            shibAddress,
            stakingAbi2,
            signer
         );

         if (address === undefined) {
            toast.success(`Please Connect Your Wallet.`, {
               duration: 4000,
               position: 'top-right',
               icon: '❌',
               style: {
                  color: '#fff',
                  background: `linear-gradient(to right, #000f58, #000624)`,
               },
            });
            return;
         }
         const _amount = ethers.parseEther(stakeAmount, 'ether');

         const stringAmount = _amount.toString();

         // console.log(stringAmount)

         const tx = await createdShibbaseInstance.stake(stringAmount, {
            gasLimit: 700000,
            gasPrice: ethers.parseUnits('15.0', 'gwei'),

         });

         setStakeAmount('');

         const receipt = await tx.wait();

         //   check if the transaction was successful
         if (receipt.status === 1) {
            setStakeLoading(false);
         } else {
            console.log('error');
            setStakeLoading(false);
         }
      } catch (err) {
         console.error(err);
         // error();
         // setStatus('error');
      }
      setStakeLoading(false);
   };

   ///////UNSTAKE///////
   const UnStake = async () => {
      try {
         setUnStakeLoading(true);
         const provider = new ethers.BrowserProvider(window.ethereum);
         const signer = await provider.getSigner();

         const contract = new ethers.Contract(
            shibAddress,
            stakingAbi2,
            signer
         );
         // get userInfo 
         const getUserInfo = await contract.userInfo(address)
         console.log(getUserInfo)


         // const contract = await getContract();

         if (address === undefined) {
            toast.success(`Please Connect Your Wallet.`, {
               duration: 4000,
               position: 'top-right',
               icon: '❌',
               style: {
                  color: '#fff',
                  background: `linear-gradient(to right, #000f58, #000624)`,
               },
            });
            return;
         }

         const _amount = ethers.parseEther(stakeAmount, 'ether');

         const stringAmount = _amount.toString();

         let tx;

         tx = await contract.unStake(stringAmount, {
            gasLimit: 2000000,
            gasPrice: ethers.parseUnits('15.0', 'gwei'),
         });
         const receipt = await tx.wait();
         if (receipt.status == 1) {
            setUnStakeLoading(false);
            window.location.reload();
         } else {
            setUnStakeLoading(false);
            // setProfitLoading(false);
         }
         // }
      } catch (err) {
         console.error(err);
         setUnStakeLoading(false);
      }

      // setStakeLoading(false);
   };

   ///// APPROVE F(x) ///////////
   // const Approved = async () => {
   //    // console.log('hello approve');
   //    setApprovedLoading(true);
   //    // setLessAmount(false);

   //    if (address === undefined) {
   //       toast.success(`Please Connect Your Wallet.`, {
   //          duration: 4000,
   //          position: 'top-right',
   //          icon: '❌',
   //          style: {
   //             color: '#fff',
   //             background: `linear-gradient(to right, #000f58, #000624)`,
   //          },
   //       });
   //       return;
   //    }
   //    try {
   //       const provider = new ethers.BrowserProvider(window.ethereum);
   //       const signer = await provider.getSigner();
   //       // const instanceContract = getContract();
   //       const contractInstance = new ethers.Contract(
   //          token,
   //          approveAbi,
   //          signer
   //       );

   //       //////////////////////////////
   //       const balance = await contractInstance.balanceOf(address);
   //       const stringBalance = ethers.formatEther(balance.toString());
   //       const formattedBalance = parseFloat(stringBalance).toFixed(3);
   //       // console.log(formattedBalance)

   //       // Check if the balance is less than 1 or if the input amount is greater than the balance
   //       if (parseFloat(formattedBalance) < 1 || parseFloat(stakeAmount) > parseFloat(formattedBalance)) {
   //          let errorMessage = '';
   //          if (parseFloat(formattedBalance) === 0) {
   //             errorMessage = 'Insufficient funds.';
   //          } else {
   //             errorMessage = `Insufficient funds or input amount exceeds available balance. Please stake at least ${formattedBalance} ${findNetworkByAddress?.symbol}.`;
   //          }

   //          toast.error(errorMessage, {
   //             duration: 4000,
   //             position: 'top-right',
   //             icon: '❌',
   //             style: {
   //                color: '#fff',
   //                background: `linear-gradient(to right, #000f58, #000624)`,
   //             },
   //          });
   //          setApprovedLoading(false);
   //          return; // Exit the function early
   //       }

   //       // Convert the input stakeAmount to Ether
   //       const _amount = ethers.parseEther(stakeAmount, 'ether');
   //       const amountToString = _amount.toString();

   //       let tx;

   //       tx = await contractInstance.approve(
   //          shibAddress,
   //          amountToString,
   //          {
   //             gasLimit: 5000000,
   //             gasPrice: ethers.parseUnits('15', 'gwei'),
   //          }
   //       );

   //       // setIsApproved(true);
   //       const receipt = await tx.wait();
   //       //   check if the transaction was successful
   //       if (receipt.status === 1) {
   //          toast.success(`Token Approved.`, {
   //             duration: 4000,
   //             position: 'top-right',
   //             icon: '✅',
   //             style: {
   //                color: '#fff',
   //                background: `linear-gradient(to right, #000f58, #000624)`,
   //             },
   //          });
   //          setIsApproved(true);
   //          setApprovedLoading(false);
   //       } else {
   //       }
   //       // }

   //    } catch (error) {
   //       console.error(error);

   //       setApprovedLoading(false);
   //       if (error.code === 4001) {
   //          // User cancelled the transaction, set loading to false
   //          setApprovedLoading(false);
   //       } else {
   //          // Handle other transaction errors
   //          console.error(error);
   //       }
   //       setApprovedLoading(false);
   //    }
   //    setApprovedLoading(false);


   // };


   const Approved = async () => {
      setApprovedLoading(true);

      if (address === undefined) {
         toast.error(`Please Connect Your Wallet.`, {
            duration: 4000,
            position: 'top-right',
            icon: '❌',
            style: {
               color: '#fff',
               background: `linear-gradient(to right, #000f58, #000624)`,
            },
         });
         setApprovedLoading(false);
         return;
      }

      try {
         const provider = new ethers.BrowserProvider(window.ethereum);
         const signer = await provider.getSigner();

         const contractInstance = new ethers.Contract(
            token,
            approveAbi,
            signer
         );

         // Check token balance
         const balance = await contractInstance.balanceOf(address);
         const stringBalance = ethers.formatEther(balance.toString());
         const formattedBalance = parseFloat(stringBalance).toFixed(3);

         // Validate balance and stake amount
         if (parseFloat(formattedBalance) < 1 || parseFloat(stakeAmount) > parseFloat(formattedBalance)) {
            const errorMessage = parseFloat(formattedBalance) === 0
               ? 'Insufficient funds.'
               : `Insufficient funds or input amount exceeds available balance. Please stake at most ${formattedBalance} ${findNetworkByAddress?.symbol}.`;

            toast.error(errorMessage, {
               duration: 4000,
               position: 'top-right',
               icon: '❌',
               style: {
                  color: '#fff',
                  background: `linear-gradient(to right, #000f58, #000624)`,
               },
            });
            setApprovedLoading(false);
            return;
         }

         // Convert stake amount to Wei
         const _amount = ethers.parseEther(stakeAmount);

         // Check current allowance
         const currentAllowance = await contractInstance.allowance(address, shibAddress);
         const formattedCurrentAllowance = ethers.formatEther(currentAllowance);
         console.log(formattedCurrentAllowance, "Allowance:")

         // Decide on approve strategy
         let tx;
         if (parseFloat(formattedCurrentAllowance) >= parseFloat(stakeAmount)) {
            // Sufficient allowance already exists
            toast.success(`Sufficient allowance exists: ${formattedCurrentAllowance}`, {
               duration: 4000,
               position: 'top-right',
               icon: '✅',
            });
            setIsApproved(true);
            setApprovedLoading(false);
            return;
         } else if (parseFloat(formattedCurrentAllowance) > 0) {
            // If some allowance exists but is less than needed, reset to 0 first
            tx = await contractInstance.approve(
               shibAddress,
               0,
               {
                  gasLimit: 5000000,
                  gasPrice: ethers.parseUnits('15', 'gwei'),
               }
            );
            await tx.wait();
         }

         // Approve the exact amount needed
         tx = await contractInstance.approve(
            shibAddress,
            _amount,
            {
               gasLimit: 5000000,
               gasPrice: ethers.parseUnits('15', 'gwei'),
            }
         );

         const receipt = await tx.wait();

         if (receipt.status === 1) {
            toast.success(`Token Approval Successful: ${stakeAmount}`, {
               duration: 4000,
               position: 'top-right',
               icon: '✅',
               style: {
                  color: '#fff',
                  background: `linear-gradient(to right, #000f58, #000624)`,
               },
            });
            setIsApproved(true);
         } else {
            toast.error('Token Approval Failed', {
               duration: 4000,
               position: 'top-right',
               icon: '❌',
            });
         }

      } catch (error) {
         console.error(error);

         if (error.code === 4001) {
            toast.error('Transaction Cancelled', {
               duration: 4000,
               position: 'top-right',
               icon: '❌',
            });
         } else {
            toast.error(`Approval Error: ${error.message}`, {
               duration: 4000,
               position: 'top-right',
               icon: '❌',
            });
         }
      } finally {
         setApprovedLoading(false);
      }
   };


   const handleButtonAboveClick = (buttonState) => {
      setStakeButtonState(buttonState);
   };

   const handleStakeAndUnStakeChange = async () => {
      if (stakeButtonState === 'Stake') {
         if (isApproved) {
            Stake();
         } else {
            await Approved();
         }
      } else {
         await UnStake();
      }
   };

   useEffect(() => {
      AOS.init({ duration: 3000 });
   }, []);



   return (
      <>
         <Toaster />
         <div className='container mx-auto mt-24' data-aos="fade-up"
         >

            <h1 className='text-center text-5xl'>{findNetworkDetails?.name}</h1>
            <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-[80%] md:w-[75%] lg:w-[85%] m-auto my-10">
               {/* left side */}
               <div className="w-full md:w-[80%] m-auto">
                  <span>Stats</span>
                  <div className="p-9 border border-gray-600 rounded-md ">
                     <h2>${findNetworkDetails?.totalStaked} {findNetworkDetails?.symbol}</h2>
                     <h6 className="text-sm text-gray-500">Total Staked {findNetworkDetails?.symbol}</h6>
                     <div className="flex justify-between items-center pt-5">
                        <span>
                           <h2>{findNetworkDetails?.apr} % Daily</h2>
                           <span className="text-sm  text-gray-500">APY</span>
                        </span>
                        <span className="inline-block h-12 border-r border-solid border-gray-600"></span>
                        <span>
                           <h2>{findNetworkDetails?.totalStaker}</h2>
                           <span className="text-sm  text-gray-500">
                              No. of Stakers
                           </span>
                        </span>
                     </div>
                  </div>
                  <div className="mt-10">
                     <span className="">Balances</span>
                     <div className="p-6  border border-gray-600 rounded-md ">
                        <div className="flex pb-3 justify-between border-b border-gray-600">
                           <div className="flex justify-center items-center">
                              {/* <img
                           src={findNetworkByAddress?.logo}
                           // width={30}
                           // height={20}
                           alt="image"
                           className="w-5 h-5 rounded-full object-cover"
                        /> */}
                              {/* <Image src="/shibase.png" className="w-4 h-4 rounded-full" width={100} height={100} alt="image name" /> */}

                              <span className="flex items-center justify-center w-7 h-7 bg-gradient-to-r from-slate-600 to-slate-500 text-white text-xs font-bold rounded-full shadow-md">{findNetworkDetails?.symbol}</span>
                           </div>
                           <p>{ethBalance}</p>
                        </div>
                        <div className="flex pt-3 justify-between items-center">
                           <div className=" pb-2 ">
                              <span className="pl-2">{parseFloat(findNetworkDetails?.userInfo?.reward).toFixed(2)} {findNetworkDetails?.symbol}</span>
                              {/* <p>Research</p> */}
                           </div>
                           <button
                              onClick={() => Claim()}
                              className="bg-gradient-to-b from-blue-500 hover:bg-blue-900 py-1 px-2 rounded-md"
                           >
                              {claimLoading ? <Loading /> : 'Claim Now'}
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
               {/* right side */}
               <div className="w-full md:w-[80%] m-auto ">
                  <div className="flex justify-center items-center py-7">
                     <button
                        onClick={() => handleButtonAboveClick('Stake')}
                        className={` border border-gray-600 px-8 md:px-12 p-2 ${stakeButtonState === 'Stake'
                           ? 'bg-blue-700 hover:bg-blue-600 text-white'
                           : ''
                           }`}
                     >
                        Stake
                     </button>
                     <button
                        onClick={() => handleButtonAboveClick('Unstake')}
                        className={` border border-gray-600 px-8 md:px-12 p-2 ${stakeButtonState === 'Unstake'
                           ? 'bg-blue-700 hover:bg-blue-600 text-white'
                           : ''
                           }`}
                     >
                        Unstake
                     </button>
                  </div>
                  <div className=" border border-gray-600 rounded-md">
                     <div className="flex justify-between items-center px-4 py-5 ">
                        <span>Stake</span>
                        <span>X</span>
                     </div>
                     <div className="w-[90%] m-auto flex justify-center items-center border border-gray-600 px-4 py-1">
                        {/* <img
                     src={findNetworkByAddress?.logo}
                     alt="image"
                     className="w-5 h-5 rounded-full object-cover"
                  /> */}
                        <Image src="/shibase.png" className="w-4 h-4 rounded-full" alt="image name" width={100} height={100} />

                        <input
                           className="w-full bg-transparent focus:outline-none p-1"
                           placeholder="0.0"
                           value={stakeAmount}
                           onChange={handleChange}
                        />
                        <button
                           onClick={handleMaxButtonClick}
                           className="text-sm py-1 px-2 bg-gradient-to-b from-blue-500 hover:bg-blue-900 rounded-md"
                        >
                           MAX
                        </button>
                     </div>

                     <div className="flex justify-center items-center px-4 py-2">

                        <button
                           onClick={handleStakeAndUnStakeChange}
                           className="w-full bg-gradient-to-b from-blue-500 hover:bg-blue-900 p-2 rounded-md"
                           disabled={stakeLoading || approvedLoading} // Disable button while loading
                        >
                           {stakeButtonState === 'Stake' && !isApproved ? (
                              approvedLoading ? (
                                 <Loading />
                              ) : (
                                 'Approve'
                              )
                           ) : stakeButtonState === 'Stake' ? (
                              stakeLoading ? (
                                 <Loading />
                              ) : (
                                 'Stake'
                              )
                           ) : unStakeLoading ? (
                              <Loading />
                           ) : (
                              stakeButtonState
                           )}
                        </button>
                     </div>

                     <div className="flex justify-between items-center py-2 px-4">
                        <span className="text-sm text-gray-500">
                           You will Recieve
                        </span>
                        <p className="text-sm">{calculateReward} {findNetworkDetails?.symbol}</p>
                     </div>
                     <div className="flex justify-between items-center py-2 px-4">
                        <span className="text-sm text-gray-500">Staking APY</span>
                        <p className="text-sm">0.5% daily</p>
                     </div>
                  </div>
               </div>
            </main>
         </div>
      </>
   );
};
export default SingleNetwork;
//
// loading

{
   /* <div class="flex items-center justify-center">
   <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
</div>; */
}
