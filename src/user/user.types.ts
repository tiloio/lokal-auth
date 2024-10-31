import type { Encrypted, JsonEncryptedWorkspaceKey } from "../key/types.ts";

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
