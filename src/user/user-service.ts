import { encodeBase64 } from "jsr:@std/encoding";
import type { StoreAdapter } from "./store/adapters/store-adapter-types.ts";
import { UserKey } from "./user-key.ts";
import { User } from "./user.ts";
import { UserAttributes } from "./user-attributes.ts";

export class UserService {
    constructor(private readonly userStore: StoreAdapter) {}

    async login(username: string, password: string): Promise<User> {
        const hashedId = await createNonPrivateId(username);
        const storedUser = await this.userStore.loadUser(hashedId);

        if (!storedUser) {
            return await this.newUser(username, hashedId, password);
        }

        const userKey = await UserKey.fromSaltedPassword(
            password,
            storedUser.salt,
        );

        const attributes = await UserAttributes.fromEncryptedJSON(
            userKey,
            storedUser.encryptedAttributes,
        );

        const user = new User(
            attributes,
            userKey,
            this.userStore,
        );

        return user;
    }

    private async newUser(
        username: string,
        hashedId: string,
        password: string,
    ) {
        const userKey = await UserKey.new(password);
        const attributes = new UserAttributes(
            hashedId,
            crypto.randomUUID(),
            username,
        );

        await this.userStore.saveUser({
            id: hashedId,
            encryptedAttributes: await attributes.toEncryptedJson(userKey),
            salt: userKey.salt,
            workspaces: [],
        });

        return new User(
            attributes,
            userKey,
            this.userStore,
        );
    }
}

async function createNonPrivateId(username: string): Promise<string> {
    const hash = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(username),
    );
    return encodeBase64(hash);
}
