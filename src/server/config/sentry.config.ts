import config from ".";
import {
    SentryAddUserToOrgParams,
    SentryAddUserToTeamParams,
    SentryService,
    SentryTeam,
    SentryUser,
    SentryUserAccess,
} from "@/lib/sentry";
import { AccountService, SERVICES } from "@/models/services";

export class FakeSentryService implements AccountService {
    users: SentryUser[] = [];
    public name = SERVICES.SENTRY;
    teams: SentryTeam[];
    userAccess: SentryUserAccess[];

    constructor(
        users: SentryUser[],
        teams: SentryTeam[] = [],
        userAccess: SentryUserAccess[] = []
    ) {
        this.users = users;
        this.teams = teams;
        this.userAccess = userAccess;
    }
    deleteUserByServiceId(id: string): Promise<void> {
        this.users = this.users.filter((user) => user.id != id);
        return Promise.resolve();
    }
    getAllTeams(): Promise<SentryTeam[]> {
        return Promise.resolve(this.teams);
    }
    fetchUserAccess(userId: string): Promise<SentryUserAccess> {
        return Promise.resolve(
            this.userAccess
                .filter((userAccess) => userAccess.id === userId)
                .map((userAccess) => {
                    return userAccess;
                })[0]
        );
    }
    getAllUsers(): Promise<{ user: SentryUser; serviceUserId: string }[]> {
        return Promise.resolve(
            this.users.map((user) => ({
                user: user,
                serviceUserId: user.id,
            }))
        );
    }

    // New method to add a user to the organization
    addUserToOrganization({
        email,
        teamRoles,
        orgRole = "member",
    }: SentryAddUserToOrgParams): Promise<SentryUser> {
        if (this.users.find((user) => user.email === email)) {
            return Promise.reject(
                new Error(
                    `User with email ${email} already exists in the organization.`
                )
            );
        }

        const newUser: SentryUser = {
            id: `${this.users.length + 1}`, // Mock ID generation
            email,
        };
        this.users.push(newUser);
        return Promise.resolve(newUser);
    }

    async changeMemberRoleInTeam({
        memberId,
        teamRole,
        teamSlug,
    }): Promise<void> {}

    // New method to add a user to a team
    addUserToTeam({
        memberId,
        teamSlug,
    }: SentryAddUserToTeamParams): Promise<void> {
        const user = this.users.find((u) => u.id === memberId);
        const team = this.teams.find((t) => t.slug === teamSlug);

        if (!user) {
            return Promise.reject(
                new Error(`User with email ${memberId} does not exist.`)
            );
        }

        if (!team) {
            return Promise.reject(
                new Error(`Team with slug ${teamSlug} does not exist.`)
            );
        }

        if (team.members?.find((member) => member.id === memberId)) {
            return Promise.reject(
                new Error(
                    `User with email ${memberId} is already a member of the team ${teamSlug}.`
                )
            );
        }

        // Add user to the team
        if (!team.members) {
            team.members = [];
        }
        team.members.push(user);
        return Promise.resolve();
    }
}

export const sentryClient =
    process.env.NODE_ENV !== "test"
        ? new SentryService(
              config.SENTRY_API_URL!,
              config.SENTRY_TOKEN!,
              config.SENTRY_ORGANIZATION!
          )
        : new FakeSentryService([]);
