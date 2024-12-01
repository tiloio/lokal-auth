import type {
    Encrypted,
    JsonEncryptedWorkspaceKey,
    LokalAuthSaltedKey,
} from "../key/types.ts";
import type { Workspace } from "../workspace/workspace.type.ts";

export type StoredUser = {
    id: string;
    salt: Uint8Array;
    encryptedAttributes: Encrypted;
    workspaces: StoredWorkspace[];
};

export type StoredWorkspace = {
    id: string;
    key: JsonEncryptedWorkspaceKey;
    encryptedAttributes: Encrypted;
};

export const CURRENT_USER_VERSION = 0;
export type User = {
    id: string;
    privacyId: string;
    username: string;
    creationDate: Date;
    lastUpdateDate: Date;
    key: LokalAuthSaltedKey;
    workspaces: Workspace[];
    _version: typeof CURRENT_USER_VERSION;
};
