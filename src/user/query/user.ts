import type { UserStoreAdapter } from "../store/adapters/user-store-adapter.types.ts";
import type { User } from "../user.types.ts";
import type { UserKeyCommand } from "../key/user-key.command.ts";
import { UserAttributesFromByteEncodedJSON } from "../attributes/attributes.user.ts";
import type { WorkspaceKeyCommand } from "../../workspace/key/workspace-key.command.ts";

export class QueryUser {
    constructor(
        private readonly userStore: UserStoreAdapter,
        private readonly userKeyService: UserKeyCommand,
        private readonly workspaceKeyCommand: WorkspaceKeyCommand,
    ) {}

    async getUserByPassword(
        hashedId: string,
        password: string,
    ): Promise<User | undefined> {
        const storedUser = await this.userStore.loadUser(hashedId);

        if (!storedUser) {
            return undefined;
        }

        const userKey = await this.userKeyService.keyFromSaltedPassword(
            password,
            storedUser.salt,
        );

        const attributes = await UserAttributesFromByteEncodedJSON(
            this.workspaceKeyCommand,
            await this.userKeyService.decrypt(
                userKey,
                storedUser.encryptedAttributes,
            ),
        );

        return {
            id: storedUser.id,
            privacyId: attributes.privacyId,
            username: attributes.username,
            creationDate: attributes.creationDate,
            lastUpdateDate: attributes.lastUpdateDate,
            key: {
                cryptoKey: userKey.cryptoKey,
                options: userKey.options,
                salt: userKey.salt,
            },
            workspaces: attributes.workspaces,
            _version: attributes._version,
        };
    }
}
