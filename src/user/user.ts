import { Workspace, type WorkspaceAdapters } from "../workspace/workspace.ts";
import type { UserStoreAdapter } from "./store/adapters/user-store-adapter-types.ts";
import type { UserAttributes } from "./user-attributes.ts";
import type { UserKey } from "./user-key.ts";

export class User {
    constructor(
        public readonly attributes: UserAttributes,
        public readonly key: UserKey,
        public readonly store: UserStoreAdapter,
        public readonly workspaceAdapters: WorkspaceAdapters,
        public readonly workspaces: Workspace[] = [],
    ) {}

    async createWorkspace(
        attributes: CreateWorkspaceAttributes,
    ): Promise<Workspace> {
        const workspace = await Workspace.new({
            userPrivacyId: this.attributes.privacyId,
            name: attributes.name,
            updateCallback: async () => {
                await this.save();
            },
        }, this.workspaceAdapters);

        this.workspaces.push(workspace);
        await this.save();

        return workspace;
    }

    async save() {
        await this.store.saveUser({
            id: this.attributes.id,
            encryptedAttributes: await this.attributes.toEncryptedJson(
                this.key,
            ),
            salt: this.key.salt,
            workspaces: await Promise.all(
                this.workspaces.map(async (workspace) => {
                    return {
                        id: workspace.attributes.id,
                        key: await workspace.key.toJSON(this.key),
                        encryptedAttributes: await workspace.attributes
                            .toEncryptedJson(
                                workspace.key,
                            ),
                    };
                }),
            ),
        });

        // TODO add event that allows the user to be saved in the server
    }
}

export type CreateWorkspaceAttributes = {
    name: string;
};
