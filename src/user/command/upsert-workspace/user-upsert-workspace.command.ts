import type { Workspace } from "../../../workspace/workspace.type.ts";
import type { WorkspaceKeyCommand } from "../../../workspace/key/workspace-key.command.ts";
import {
    UserAttributesFromByteEncodedJSON,
    UserAttributesToByteEncodedJson,
} from "../../attributes/attributes.user.ts";
import type { UserKeyCommand } from "../../key/user-key.command.ts";
import type { UserStoreAdapter } from "../../store/adapters/user-store-adapter.types.ts";
import type { User } from "../../user.types.ts";

export class UserUpsertWorkspaceCommand {
    constructor(
        private readonly store: UserStoreAdapter,
        private readonly keyCommand: UserKeyCommand,
        private readonly workspaceKeyCommand: WorkspaceKeyCommand,
    ) {}

    async upsertWorkspace(
        user: User,
        workspace: Workspace,
    ): Promise<void> {
        const loadedUser = await this.store.loadUser(user.id);

        if (!loadedUser) {
            throw new Error(
                `User with id "${user.id}" not found in the user store`,
            );
        }

        const attributes = await UserAttributesFromByteEncodedJSON(
            this.workspaceKeyCommand,
            await this.keyCommand.decrypt(
                user.key,
                loadedUser.encryptedAttributes,
            ),
        );

        attributes.workspaces.push(workspace);
        attributes.lastUpdateDate = new Date();

        await this.store.saveUser({
            id: user.id,
            encryptedAttributes: await this.keyCommand.encrypt(
                user.key,
                await UserAttributesToByteEncodedJson(
                    this.workspaceKeyCommand,
                    attributes,
                ),
            ),
            salt: user.key.salt,
        });
    }
}
