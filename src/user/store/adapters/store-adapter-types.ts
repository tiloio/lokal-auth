import type { StoredUser } from "../../user.types.ts";

export interface StoreAdapter {
    loadUser(id: string): Promise<StoredUser | undefined>;
    saveUser(user: StoredUser): Promise<void>;
}
