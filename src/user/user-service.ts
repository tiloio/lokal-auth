import { createSalt } from "../key/key-utils.ts";
import type { SaltStoreAdapter } from "./store/adapters/store-adapter-types.ts";
import { UserKey } from "./user-key.ts";
import { User } from "./user.ts";

export class UserService {
    constructor(private readonly saltStore: SaltStoreAdapter) {}

    async login(id: string, password: string): Promise<User> {
        const loadedSalt = await this.saltStore.loadSalt(id);
        const salt = loadedSalt ?? createSalt();

        const userKey = await UserKey.fromSaltedPassword(password, salt);
        const user = new User({ id }, userKey);

        await this.saltStore.saveSalt(id, userKey.salt);

        return user;
    }
}