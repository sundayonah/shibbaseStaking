import { useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { StakingContext } from "@/Context/StakeContext";
import CreateStakeModal from "./CreateStakeModal";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Toaster } from "react-hot-toast";
import { FormatDateTime } from "@/lib/helper";

const NetworkCard = ({ network }) => (
  <Link
    href={`/singleNetwork?shibAddress=${network.shibaseStake}&token=${network.token}`}
    className="block transition-transform hover:scale-105"
  >
    <Card className="h-full w-full border-blue-950 bg-gradient-to-br from-slate-900 to-slate-800">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">{network.name}</h3>
          <Image
            src="/shibase.png"
            className="w-8 h-8 rounded-full"
            width={100}
            height={100}
            alt={`${network.name} logo`}
            priority
          />
        </div>
        <div className="mt-4 space-y-2">
          <StatsRow label="Total Stake" value={network.totalStaked} />
          <StatsRow label="APR" value={`${network.apr}%`} />
          <StatsRow label="Total Stakers" value={network.totalStaker} />
          <StatsRow label="Minimum Stake" value={network.min} />
          <StatsRow label="Duration (Days)" value={FormatDateTime(network.duration)} />
        </div>
      </CardContent>
    </Card>
  </Link>
);

const StatsRow = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-gray-400 ">{label}</span>
    <span className="text-sm font-semibold text-white">{value}</span>
  </div>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64 mt-32">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-500" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-8 h-8 border-4 border-blue-500 rounded-full animate-ping" />
      </div>
    </div>
  </div>
);

const EmptyState = () => (
  <Alert className="max-w-2xl mx-auto bg-slate-900 border-blue-500">
    <AlertDescription className="text-center py-8">
      <p className="text-xl text-gray-300 mb-4">No networks have been created yet</p>
      <p className="text-gray-400">Create your first network using the button above!</p>
    </AlertDescription>
  </Alert>
);

const NetworkList = () => {
  const { createdShibbase, isLoading } = useContext(StakingContext);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-32">
      <Toaster />
      <div className="flex justify-end mb-8">
        <CreateStakeModal />
      </div>

      {createdShibbase.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {createdShibbase.map((network) => (
            <NetworkCard key={network.shibaseStake} network={network} />
          ))}
        </div>
      )}

    </div>
  );
};

export default NetworkList;