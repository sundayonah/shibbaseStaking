import React, { useContext, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StakingContext } from '@/Context/StakeContext';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import {
   aprOptions,
   durationOptions,
   getMinimumStakeForDuration,
} from '@/lib/helper';

export function CreateStakeModal() {
   const {
      CreateStake,
      isCreating,
      isConnected,
      connect,
      stakeParams,
      setStakeParams,
      address,
      approveToken,
      isApproving,
   } = useContext(StakingContext);

   const [isOpen, setIsOpen] = useState(false);
   const [customApr, setCustomApr] = useState('');
   const [selectedApr, setSelectedApr] = useState('');
   const [selectedDuration, setSelectedDuration] = useState(null);

   const handleSubmit = async (e) => {
      e.preventDefault();

      if (!isConnected) {
         try {
            await connect();
            return;
         } catch (error) {
            toast.error('Failed to connect wallet');
            return;
         }
      }

      console.log(stakeParams, ' stake parameters');
      if (
         !stakeParams.tokenAddress ||
         !stakeParams.minimumStake ||
         !stakeParams.apr ||
         !stakeParams.duration
      ) {
         toast.error('Please fill all the fields.');
         return;
      }

      try {
         const result = await CreateStake();
         if (result) {
            setIsOpen(false);
         } else {
            toast.error('Failed to create stake.');
         }
      } catch (error) {
         console.error('Error creating stake:', error);
         toast.error('An error occurred while creating the stake.');
      }
   };
   const getButtonText = () => {
      if (!isConnected) return 'Connect Wallet';
      if (isCreating) return 'Creating...';
      return 'Create Stake';
   };

   // When a new option is selected
   const handleAprChange = (value) => {
      if (value === 'input') {
         setSelectedApr('input');
         if (!customApr) {
            setCustomApr('');
         }
      } else {
         setSelectedApr(value);
         setCustomApr('');
         setStakeParams({ ...stakeParams, apr: value });
      }
   };

   // When typing in the input input
   const handleCustomAprChange = (value) => {
      setCustomApr(value);
      setStakeParams({ ...stakeParams, apr: value });
   };

   const handleDurationChange = (e) => {
      const { name, value } = e.target;

      if (name === 'duration') {
         const durationOption = durationOptions.find(
            (option) => option.value === value
         );
         // setSelectedDuration(durationOption);
      }

      setStakeParams((prev) => ({ ...prev, [name]: value }));
   };

   // Clear stakeParams and close modal when dialog is closed
   useEffect(() => {
      if (!isOpen) {
         setStakeParams({
            tokenAddress: '',
            minimumStake: '',
            apr: '',
            duration: '',
         });
      }
   }, [isOpen, setStakeParams]);

   return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
         <DialogTrigger asChild>
            <Button
               className="bg-gradient-to-br from-slate-900 to-slate-800 hover:hover:shadow-2xl shadow-xl"
               data-aos="fade-up"
               data-aos-duration="3000"
            >
               {isOpen ? 'Creating Stake...' : 'Create Stake'}
            </Button>
         </DialogTrigger>
         <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border-none shadow-xl">
            <DialogHeader>
               <DialogTitle
                  className="text-white text-xl font-bold text-center"
                  data-aos="fade-up"
                  data-aos-duration="3000"
               >
                  Create New Stake Pool
               </DialogTitle>
            </DialogHeader>

            <form
               onSubmit={handleSubmit}
               className="grid gap-4 py-3"
               data-aos="fade-up"
               data-aos-duration="3000"
            >
               <div className="grid grid-cols-4 items-center gap-4">
                  <Label
                     htmlFor="tokenAddress"
                     className="text-right text-gray-300"
                  >
                     Token Address
                  </Label>
                  <Input
                     id="tokenAddress"
                     placeholder="0x..."
                     className="col-span-3 bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
                     value={stakeParams.tokenAddress}
                     onChange={(e) =>
                        setStakeParams({
                           ...stakeParams,
                           tokenAddress: e.target.value,
                        })
                     }
                     required
                  />
               </div>

               <div className="grid grid-cols-4 items-center gap-4">
                  <Label
                     htmlFor="minimumStake"
                     className="text-right text-gray-300"
                  >
                     Minimum Stake
                  </Label>
                  <Input
                     id="minimumStake"
                     type="number"
                     placeholder="100"
                     className="col-span-3 bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
                     value={stakeParams.minimumStake}
                     onChange={(e) =>
                        setStakeParams({
                           ...stakeParams,
                           minimumStake: e.target.value,
                        })
                     }
                     required
                     step="0.01"
                     min="0"
                  />
               </div>

               <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="apr" className="text-right text-gray-300">
                     APR (%)
                  </Label>
                  <div className="col-span-3 relative">
                     <select
                        id="apr"
                        name="apr"
                        className="w-full bg-slate-800 py-2 px-2 border-slate-700 text-white placeholder:text-gray-500 rounded-md"
                        value={selectedApr === 'input' ? 'input' : selectedApr}
                        onChange={(e) => handleAprChange(e.target.value)}
                        required
                     >
                        <option value="">Select APR</option>
                        {aprOptions.map((option) => (
                           <option key={option.value} value={option.value}>
                              {option.label}
                           </option>
                        ))}
                     </select>

                     {selectedApr === 'input' && (
                        <input
                           id="customApr"
                           type="number"
                           placeholder="Enter input APR"
                           className="mt-2 w-full bg-slate-800 py-2 px-2 border-slate-700 text-white placeholder:text-gray-500 rounded-md"
                           value={customApr}
                           onChange={(e) =>
                              handleCustomAprChange(e.target.value)
                           }
                           step="0.1"
                           min="0"
                           required
                        />
                     )}
                  </div>
               </div>

               <div className="grid grid-cols-4 items-center gap-4">
                  <Label
                     htmlFor="duration"
                     className="text-right text-gray-300"
                  >
                     Duration
                  </Label>
                  <div className="col-span-3 relative">
                     <select
                        id="duration"
                        name="duration"
                        className="w-full bg-slate-800 py-2 px-2 border-slate-700 text-white placeholder:text-gray-500 rounded-md"
                        value={stakeParams.duration}
                        onChange={handleDurationChange}
                        required
                     >
                        <option value="">Select Duration</option>
                        {durationOptions.map((option) => (
                           <option key={option.value} value={option.value}>
                              {option.label}
                           </option>
                        ))}
                     </select>
                  </div>
               </div>
               <div className="flex justify-center space-x-2 mt-4">
                  <Button
                     type="submit"
                     disabled={isCreating}
                     className="bg-blue-600 hover:bg-blue-700 w-full disabled:opacity-50"
                  >
                     {getButtonText()}
                  </Button>
               </div>
            </form>
         </DialogContent>
      </Dialog>
   );
}

export default CreateStakeModal;
