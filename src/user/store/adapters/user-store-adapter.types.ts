import type { Encrypted } from "../../../key/types.ts";

export interface UserStoreAdapter {
    loadUser(id: string): Promise<NewStoredUser | undefined>;
    saveUser(user: NewStoredUser): Promise<void>;
}

export type NewStoredUser = {
    id: string;
    salt: Uint8Array;
    encryptedAttributes: Encrypted;
};
