import type { Encrypted } from "../key/types.ts";

export type StoredUser = {
    id: string;
    salt: Uint8Array;
    encryptedAttributes: Encrypted;
    workspaces: StoredWorkspace[];
};

export type StoredWorkspace = {
    id: string;
    encryptedAttributes: Encrypted;
};
