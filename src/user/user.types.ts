import type { Encrypted } from "../key/types.ts";
import type { WorkspaceAttributes } from "../workspace/workspace.ts";

export type StoreUserAttributes = {
    id: string;
    name: string;
    email: string;
    salt: Uint8Array;
    workspaces: StoreUserWorkspaceAttribute[];
};

export type StoreUserWorkspaceAttribute = {
    attributes: WorkspaceAttributes;
    encryptedKey: Encrypted;
};
