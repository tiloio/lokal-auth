//deno-lint-ignore-file require-await

import type { StoredUser } from "../../user.types.ts";
import type { UserStoreAdapter } from "./user-store-adapter.types.ts";

export class InMemoryUserStoreAdapter implements UserStoreAdapter {
    private readonly users = new Map<string, StoredUser>();

    async loadUser(userId: string): Promise<StoredUser | undefined> {
        const user = this.users.get(userId);
        return user;
    }

    async saveUser(user: StoredUser): Promise<void> {
        this.users.set(user.id, user);
    }
}
