import { createIV, createSalt } from "../../key/key-utils.ts";
import type {
    DerivedKeyOptions,
    Encrypted,
    JsonLocalAuthKey,
    LokalAuthKey,
} from "../../key/types.ts";

export class UserKey implements LokalAuthKey {
    private static ENCRYPTION_ALGORITHM = "AES-GCM";
    private static KEY_OPERATIONS = [
        "encrypt",
        "decrypt",
        "wrapKey",
        "unwrapKey",
    ] as const;

    private constructor(
        private key: CryptoKey,
        public readonly options: DerivedKeyOptions,
    ) {}

    static async new(password: string): Promise<UserKey> {
        const { key, options } = await this.createKey(password, createSalt());
        return new UserKey(key, options);
    }

    static async fromSaltedPassword(
        password: string,
        salt: Uint8Array,
    ): Promise<UserKey> {
        const { key, options } = await this.createKey(password, salt);
        return new UserKey(key, options);
    }

    static async fromJSON(jwk: JsonLocalAuthKey): Promise<UserKey> {
        const key = await crypto.subtle.importKey(
            "jwk",
            jwk.key,
            this.ENCRYPTION_ALGORITHM,
            true,
            [...UserKey.KEY_OPERATIONS],
        );
        return new UserKey(key, jwk.options);
    }

    private static async createKey(password: string, salt: Uint8Array) {
        const options: DerivedKeyOptions = {
            type: "user",
            version: "001",
            deriveKeyAlgorithm: "PBKDF2",
            key: {
                iterations: 900_000,
                algorithm: "AES-GCM",
                hash: "SHA-256",
                salt: salt,
                length: 256,
            },
        } as const;

        const passBuffer = new TextEncoder().encode(password);

        const deriveKey = await globalThis.crypto.subtle.importKey(
            "raw",
            passBuffer,
            { name: options.deriveKeyAlgorithm },
            false,
            ["deriveBits", "deriveKey"],
        );

        const key = await globalThis.crypto.subtle.deriveKey(
            {
                name: options.deriveKeyAlgorithm,
                salt: options.key.salt,
                iterations: options.key.iterations,
                hash: options.key.hash,
            },
            deriveKey,
            { name: options.key.algorithm, length: options.key.length },
            true,
            [...UserKey.KEY_OPERATIONS],
        );

        return {
            key,
            options: options,
        };
    }

    async encrypt(dataToEncrypt: Uint8Array): Promise<Encrypted> {
        const iv = createIV();

        const encryptedData = await globalThis.crypto.subtle.encrypt(
            {
                name: UserKey.ENCRYPTION_ALGORITHM,
                iv: iv,
            },
            this.key,
            dataToEncrypt,
        );

        return { data: new Uint8Array(encryptedData), iv };
    }

    async decrypt(encrypted: Encrypted): Promise<Uint8Array> {
        const result = await crypto.subtle.decrypt(
            { name: this.options.key.algorithm, iv: encrypted.iv },
            this.key,
            encrypted.data,
        );

        return new Uint8Array(result);
    }

    async toJSON(): Promise<JsonLocalAuthKey> {
        return {
            key: await crypto.subtle.exportKey("jwk", this.key),
            options: this.options,
        };
    }

    get salt(): Uint8Array {
        return this.options.key.salt;
    }

    get cryptoKey(): CryptoKey {
        return this.key;
    }
}
