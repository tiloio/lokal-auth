import { encodeBase64 } from "jsr:@std/encoding";
import type { UserStoreAdapter } from "./store/adapters/user-store-adapter-types.ts";
import { UserKey } from "./user-key.ts";
import { User } from "./user.ts";
import { UserAttributes } from "./user-attributes.ts";
import type { WorkspaceAdapters } from "../workspace/workspace.ts";

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

        const user = new User(
            attributes,
            userKey,
            this.userStore,
            this.workspaceAdapters,
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
