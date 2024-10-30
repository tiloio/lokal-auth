import type { StoreUserAttributes } from "../../user.types.ts";

export interface StoreAdapter {
    loadUser(id: string): Promise<StoreUserAttributes | undefined>;
    saveUser(user: StoreUserAttributes): Promise<void>;
}

export interface SaltStoreAdapter {
    loadSalt(id: string): Promise<Uint8Array | undefined>;
    saveSalt(id: string, salt: Uint8Array): Promise<void>;
}