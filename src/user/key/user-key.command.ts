import { decodeBase64, encodeBase64 } from "jsr:@std/encoding/base64";
import { createIV, createSalt } from "../../key/key-utils.ts";
import type {
    Encrypted,
    JsonLokalAuthSaltedKey,
    LokalAuthSaltedKey,
    LokalAuthSaltedKeyCommand,
} from "../../key/types.ts";

export class UserKeyCommand implements LokalAuthSaltedKeyCommand {
    private static DERIVE_OPTIONS = {
        deriveKeyAlgorithm: "PBKDF2",
        key: {
            iterations: 900_000,
            algorithm: "AES-GCM",
            hash: "SHA-256",
            length: 256,
            operations: [
                "encrypt",
                "decrypt",
                "wrapKey",
                "unwrapKey",
            ],
        },
    } as const;

    constructor() {}

    async createKey(password: string): Promise<LokalAuthSaltedKey> {
        return await this.initKey(password, createSalt());
    }

    async keyFromSaltedPassword(
        password: string,
        salt: Uint8Array,
    ): Promise<LokalAuthSaltedKey> {
        return await this.initKey(password, salt);
    }

    async fromJSON(
        jsonKey: JsonLokalAuthSaltedKey,
    ): Promise<LokalAuthSaltedKey> {
        const key = await crypto.subtle.importKey(
            "jwk",
            jsonKey.cryptoKey,
            jsonKey.options.key.algorithm,
            true,
            [...UserKeyCommand.DERIVE_OPTIONS.key.operations],
        );
        return {
            cryptoKey: key,
            salt: decodeBase64(jsonKey.salt),
            options: jsonKey.options,
        };
    }

    private async initKey(
        password: string,
        salt: Uint8Array,
    ): Promise<LokalAuthSaltedKey> {
        const passBuffer = new TextEncoder().encode(password);

        const deriveKey = await globalThis.crypto.subtle.importKey(
            "raw",
            passBuffer,
            { name: UserKeyCommand.DERIVE_OPTIONS.deriveKeyAlgorithm },
            false,
            ["deriveBits", "deriveKey"],
        );

        const key = await globalThis.crypto.subtle.deriveKey(
            {
                name: UserKeyCommand.DERIVE_OPTIONS.deriveKeyAlgorithm,
                salt: salt,
                iterations: UserKeyCommand.DERIVE_OPTIONS.key.iterations,
                hash: UserKeyCommand.DERIVE_OPTIONS.key.hash,
            },
            deriveKey,
            {
                name: UserKeyCommand.DERIVE_OPTIONS.key.algorithm,
                length: UserKeyCommand.DERIVE_OPTIONS.key.length,
            },
            true,
            [...UserKeyCommand.DERIVE_OPTIONS.key.operations],
        );

        return {
            cryptoKey: key,
            salt,
            options: {
                type: "user",
                version: "001",
                key: {
                    algorithm: UserKeyCommand.DERIVE_OPTIONS.key.algorithm,
                    length: UserKeyCommand.DERIVE_OPTIONS.key.length,
                },
            },
        };
    }

    async encrypt(
        key: LokalAuthSaltedKey,
        dataToEncrypt: Uint8Array,
    ): Promise<Encrypted> {
        const iv = createIV();

        const encryptedData = await globalThis.crypto.subtle.encrypt(
            {
                name: key.options.key.algorithm,
                iv: iv,
            },
            key.cryptoKey,
            dataToEncrypt,
        );

        return { data: new Uint8Array(encryptedData), iv };
    }

    async decrypt(
        key: LokalAuthSaltedKey,
        encrypted: Encrypted,
    ): Promise<Uint8Array> {
        const result = await crypto.subtle.decrypt(
            { name: key.options.key.algorithm, iv: encrypted.iv },
            key.cryptoKey,
            encrypted.data,
        );

        return new Uint8Array(result);
    }

    async toJSON(key: LokalAuthSaltedKey): Promise<JsonLokalAuthSaltedKey> {
        return {
            cryptoKey: await crypto.subtle.exportKey("jwk", key.cryptoKey),
            options: key.options,
            salt: encodeBase64(key.salt),
        };
    }
}
