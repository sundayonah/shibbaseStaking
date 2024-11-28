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

// export const FormatDurationInDays = (durationInSeconds) => {
//     const secondsInADay = 86400; // Number of seconds in a day
//     const durationInDays = durationInSeconds / secondsInADay;
//     return durationInDays.toFixed(2); // Limit to 2 decimal places
// };


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


// Hi Gm Sunday, can you make these adjusments ?
//     Flexibel   Free
// 0.025 ET 1 Week
// 0.05ETH 2 weeks
// 0.1 ETH  1 month
// 0.3 ETH 3 month
// 0.5 ETH 6 Months

export const durationOptions = [
    { label: 'Free', value: '3', min: '0' },
    { label: '1 Week', value: '7', min: '0.025' },
    { label: '2 Weeks', value: '14', min: '0.05' },
    { label: '1 Month', value: '30', min: '0.1' },
    { label: '3 Months', value: '90', min: '0.3' },
    { label: '6 Months', value: '180', min: '0.5' },
];

export const getMinimumStakeForDuration = (durationValue) => {
    const selectedOption = durationOptions.find(
        (option) => option.value === durationValue
    );
    return selectedOption ? selectedOption.min : '0';
};

export const aprOptions = [
    { label: '5%', value: '5' },
    { label: '10%', value: '10' },
    { label: '15%', value: '15' },
    { label: '20%', value: '20' },
    { label: 'other', value: 'input' },
];

// Converts seconds to a human-readable format (days, hours, minutes, seconds)
const formatTime = (seconds) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds %= 24 * 60 * 60;
    const hours = Math.floor(seconds / (60 * 60));
    seconds %= 60 * 60;
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

const formatTimeInDays = (seconds) => {
    const days = Math.floor(seconds / (24 * 3600)); // Calculate total days
    seconds %= (24 * 3600); // Remaining seconds after calculating days
    const hours = Math.floor(seconds / 3600); // Calculate remaining hours
    seconds %= 3600; // Remaining seconds after calculating hours
    const minutes = Math.floor(seconds / 60); // Calculate remaining minutes
    seconds %= 60; // Remaining seconds

    // Create the formatted string
    let timeString = '';
    if (days > 0) {
        timeString += `${days} day${days > 1 ? 's' : ''}`;
    }
    if (hours > 0) {
        if (timeString) timeString += ', ';
        timeString += `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    if (minutes > 0) {
        if (timeString) timeString += ', ';
        timeString += `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    if (seconds > 0) {
        if (timeString) timeString += ' and ';
        timeString += `${seconds} second${seconds > 1 ? 's' : ''}`;
    }

    return timeString;
};


// Converts epoch time (seconds) into a human-readable date
const formatEpoch = (epochTime) => {
    const date = new Date(epochTime * 1000); // Convert seconds to milliseconds
    return date.toLocaleString(); // Format date in a human-readable format
};
