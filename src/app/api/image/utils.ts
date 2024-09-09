export const getFileName = {
    member: (username) => `members/${username}/avatar.jpg`,
    startup: (startupId, fileIdentifier) =>
        `startups/${startupId}/${fileIdentifier}.jpg`,
    incubator: (incubatorId) => `incubators/${incubatorId}/logo.jpg`,
};
