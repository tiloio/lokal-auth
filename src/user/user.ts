import type { UserKey } from "../../mod.ts";
import { Workspace, type WorkspaceAdapters } from "../workspace/workspace.ts";
import type { StoreAdapter } from "./store/adapters/store-adapter-types.ts";
import type { UserAttributes } from "./user-attributes.ts";

export class User {
    constructor(
        public readonly attributes: UserAttributes,
        public readonly key: UserKey,
        public readonly store: StoreAdapter,
        private readonly workspaces: Workspace[] = [],
    ) {}

    async newWorkspace(attributes: NewWorkspaceAttributes): Promise<Workspace> {
        const workspace = await Workspace.new({
            userPrivacyId: this.attributes.privacyId,
            name: attributes.name,
        }, attributes.adapters);

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

export type NewWorkspaceAttributes = {
    name: string;
    adapters: WorkspaceAdapters;
};
