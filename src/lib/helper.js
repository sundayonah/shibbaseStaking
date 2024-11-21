import { Alert, AlertDescription } from "@/components/ui/alert";

// Helper function to convert days to epoch duration
export const ConvertToEpochDuration = (days) => {
    if (!days) return 0;

    // Current timestamp in seconds
    const currentTimestamp = Math.floor(Date.now() / 1000);

    // Convert days to seconds and add to current timestamp
    const durationInSeconds = parseInt(days) * 86400;
    const futureTimestamp = currentTimestamp + durationInSeconds;

    return futureTimestamp;
};


export const FormatDateTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return `${date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
};

export const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-64 mt-32">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-500" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-8 h-8 border-4 border-blue-500 rounded-full animate-ping" />
            </div>
        </div>
    </div>
);

export const EmptyState = () => (
    <Alert className="max-w-2xl mx-auto bg-slate-900 border-blue-500">
        <AlertDescription className="text-center py-8">
            <p className="text-xl text-gray-300 mb-4">No networks have been created yet</p>
            <p className="text-gray-400">Create your first network using the button above!</p>
        </AlertDescription>
    </Alert>
);


export const StatsRow = ({ label, value }) => (
    <div className="flex justify-between items-center">
        <span className="text-sm text-gray-400 ">{label}</span>
        <span className="text-sm font-semibold text-white">{value}</span>
    </div>
);
