import type { UserKeyCommand } from "../../key/user-key.command.ts";
import type { UserCreateOptions } from "./user-create.command.types.ts";
import type { UserStoreAdapter } from "../../store/adapters/user-store-adapter.types.ts";
import { CURRENT_USER_VERSION, type User } from "../../user.types.ts";
import { UserAttributesToByteEncodedJson } from "../../attributes/attributes.user.ts";
import type { WorkspaceKeyCommand } from "../../../workspace/key/workspace-key.command.ts";

export class UserCreateCommand {
    constructor(
        private readonly store: UserStoreAdapter,
        private readonly keyCommand: UserKeyCommand,
        private readonly workspaceKeyCommand: WorkspaceKeyCommand,
    ) {}

    async createUser(user: UserCreateOptions): Promise<User> {
        const creationDate = new Date();
        const createdUser: User = {
            id: user.hashedId,
            privacyId: crypto.randomUUID(),
            username: user.username,
            creationDate: creationDate,
            lastUpdateDate: creationDate,
            key: await this.keyCommand.createKey(user.password),
            workspaces: [],
            _version: CURRENT_USER_VERSION,
        };

        const encryptedAttributes = await this.keyCommand.encrypt(
            createdUser.key,
            await UserAttributesToByteEncodedJson(
                this.workspaceKeyCommand,
                createdUser,
            ),
        );

        await this.store.saveUser({
            id: createdUser.id,
            encryptedAttributes: encryptedAttributes,
            salt: createdUser.key.salt,
        });

        return createdUser; // TODO: remove this because we should only have one place where the User object is created in the code
    }
}
