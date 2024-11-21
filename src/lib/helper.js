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
    return `${date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
};
