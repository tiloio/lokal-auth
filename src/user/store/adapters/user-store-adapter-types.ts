import type { StoredUser } from "../../user.types.ts";

export interface UserStoreAdapter {
    loadUser(id: string): Promise<StoredUser | undefined>;
    saveUser(user: StoredUser): Promise<void>;
}
