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
