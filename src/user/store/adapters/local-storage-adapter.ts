//deno-lint-ignore-file require-await

import { decodeBase64, encodeBase64 } from "jsr:@std/encoding/base64";
import type { StoredUser } from "../../user.types.ts";
import type {
    NewStoredUser,
    UserStoreAdapter,
} from "./user-store-adapter.types.ts";

export class LocalStorageAdapter implements UserStoreAdapter {
    async loadUser(userId: string): Promise<NewStoredUser | undefined> {
        const user = localStorage.getItem(createKey(userId));
        if (!user) {
            return undefined;
        }

        const parsedUser = checkUser(JSON.parse(user));

        return {
            id: parsedUser.id,
            encryptedAttributes: {
                data: decodeBase64(parsedUser.encryptedAttributes.data),
                iv: decodeBase64(parsedUser.encryptedAttributes.iv),
            },
            salt: decodeBase64(parsedUser.salt),
        };
    }

    async saveUser(user: StoredUser): Promise<void> {
        const stringifiedUser = {
            id: user.id,
            encryptedAttributes: {
                data: encodeBase64(user.encryptedAttributes.data),
                iv: encodeBase64(user.encryptedAttributes.iv),
            },
            salt: encodeBase64(user.salt),
        } as StringifiedStoreUserAttributes;
        localStorage.setItem(
            createKey(user.id),
            JSON.stringify(stringifiedUser),
        );
    }
}

function createKey(id: string) {
    return `lokal-auth-user-${id}`;
}

type StringifiedStoreUserAttributes = {
    id: string;
    encryptedAttributes: StringifiedEncrypted;
    salt: string;
};

type StringifiedEncrypted = {
    data: string;
    iv: string;
};

function checkUser(user: unknown): StringifiedStoreUserAttributes {
    if (typeof user !== "object" || user === null) {
        throw error(user, "user", "object");
    }

    if (!("id" in user) || typeof user.id !== "string") {
        throw error(user, "id", "string");
    }

    if (
        !("encryptedAttributes" in user) ||
        typeof user.encryptedAttributes !== "object"
    ) {
        throw error(user, "encryptedAttributes", "object");
    }

    if (!("salt" in user) || typeof user.salt !== "string") {
        throw error(user, "salt", "string");
    }

    return {
        id: user.id,
        encryptedAttributes: checkEncrypted(user.encryptedAttributes),
        salt: user.salt,
    };
}

function checkEncrypted(encrypted: unknown): StringifiedEncrypted {
    if (typeof encrypted !== "object" || encrypted === null) {
        throw error(encrypted, "encrypted", "object");
    }

    if (!("data" in encrypted) || typeof encrypted.data !== "string") {
        throw error(encrypted, "data", "string");
    }

    if (!("iv" in encrypted) || typeof encrypted.iv !== "string") {
        throw error(encrypted, "iv", "string");
    }

    return {
        data: encrypted.data,
        iv: encrypted.iv,
    };
}

//deno-lint-ignore no-explicit-any
function error(eventData: any, name: string, type: string) {
    return new Error(
        `No valid "${name}" property as ${type}. Got "${
            eventData?.[name]
        }" as type "${typeof eventData?.[name]}" in the object: \n${
            JSON.stringify(eventData, null, 2)
        }\n\n`,
    );
}
