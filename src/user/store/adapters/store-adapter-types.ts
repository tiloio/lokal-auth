import type { StoreUserAttributes } from "../../user.types.ts";

export interface StoreAdapter {
    loadUser(id: string): Promise<StoreUserAttributes | undefined>;
    saveUser(user: StoreUserAttributes): Promise<void>;
}
