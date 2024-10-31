import { encodeBase64 } from "jsr:@std/encoding";
import type { UserStoreAdapter } from "./store/adapters/user-store-adapter-types.ts";
import { UserKey } from "./user-key.ts";
import { User } from "./user.ts";
import { UserAttributes } from "./user-attributes.ts";
import { Workspace, type WorkspaceAdapters } from "../workspace/workspace.ts";
import { WorkspaceAttributes } from "../workspace/workspace-attributes.ts";
import { WorkspaceKey } from "../workspace/workspace-key.ts";

export class UserService {
    constructor(
        private readonly userStore: UserStoreAdapter,
        private readonly workspaceAdapters: WorkspaceAdapters,
    ) {}

    async login(
        username: string,
        password: string,
    ): Promise<User> {
        const hashedId = await createNonPrivateId(username);
        const storedUser = await this.userStore.loadUser(hashedId);

        if (!storedUser) {
            return await this.newUser(username, hashedId, password);
        }

        const userKey = await UserKey.fromSaltedPassword(
            password,
            storedUser.salt,
        );

        const attributes = await UserAttributes.fromEncryptedJSON(
            userKey,
            storedUser.encryptedAttributes,
        );

        const workspaces = await Promise.all(
            storedUser.workspaces.map(async (workspace) => {
                const workspaceKey = await WorkspaceKey.fromJSON(
                    userKey,
                    workspace.key,
                );
                const attributes = await WorkspaceAttributes.fromEncryptedJSON(
                    workspaceKey,
                    workspace.encryptedAttributes,
                );
                return await Workspace.fromKey(
                    {
                        key: workspaceKey,
                        id: workspace.id,
                        name: attributes.name,
                        userPrivacyId: attributes.userPrivacyId,
                        creationDate: attributes.creationDate,
                        lastUpdateDate: attributes.lastUpdateDate,
                    },
                    this.workspaceAdapters,
                );
            }),
        );

        const user = new User(
            attributes,
            userKey,
            this.userStore,
            this.workspaceAdapters,
            workspaces,
        );

        return user;
    }

    private async newUser(
        username: string,
        hashedId: string,
        password: string,
    ) {
        const userKey = await UserKey.new(password);
        const privacyId = crypto.randomUUID();
        const attributes = new UserAttributes(
            hashedId,
            privacyId,
            username,
            new Date(),
        );

        const user = new User(
            attributes,
            userKey,
            this.userStore,
            this.workspaceAdapters,
        );

        await user.save();

        return user;
    }
}

async function createNonPrivateId(username: string): Promise<string> {
    const hash = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(username),
    );
    return encodeBase64(hash);
}
