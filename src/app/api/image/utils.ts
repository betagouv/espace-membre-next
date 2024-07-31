export const getFileName = {
    member: (username) => `members/${username}/avatar.jpg`,
    startupHero: (startupId) => `s3/startups/${startupId}/hero.jpg`,
    startupShot: (startupId) => `s3/startups/${startupId}/shot.jpg`,
};
