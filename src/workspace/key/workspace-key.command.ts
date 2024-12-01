import { createIV } from "../../key/key-utils.ts";
import type {
    Encrypted,
    JsonLokalAuthKey,
    LokalAuthKeyCommand,
    NewLokalAuthKey,
} from "../../key/types.ts";

export class WorkspaceKeyCommand implements LokalAuthKeyCommand {
    private static OPTIONS = {
        algorithm: "AES-GCM" as const,
        length: 256 as const,
        operations: ["encrypt", "decrypt"] as KeyUsage[],
    };

    constructor() {}

    async createKey(): Promise<NewLokalAuthKey> {
        const cryptoKey = await globalThis.crypto.subtle.generateKey(
            {
                name: WorkspaceKeyCommand.OPTIONS.algorithm,
                length: WorkspaceKeyCommand.OPTIONS.length,
            },
            true,
            WorkspaceKeyCommand.OPTIONS.operations,
        );

        return {
            cryptoKey,
            options: {
                type: "workspace",
                version: "001",
                key: {
                    algorithm: WorkspaceKeyCommand.OPTIONS.algorithm,
                    length: WorkspaceKeyCommand.OPTIONS.length,
                },
            },
        };
    }

    async fromJSON(
        jsonKey: JsonLokalAuthKey,
    ): Promise<NewLokalAuthKey> {
        const key = await crypto.subtle.importKey(
            "jwk",
            jsonKey.cryptoKey,
            jsonKey.options.key.algorithm,
            true,
            WorkspaceKeyCommand.OPTIONS.operations,
        );
        return {
            cryptoKey: key,
            options: jsonKey.options,
        };
    }

    async encrypt(
        key: NewLokalAuthKey,
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
        key: NewLokalAuthKey,
        encrypted: Encrypted,
    ): Promise<Uint8Array> {
        const result = await crypto.subtle.decrypt(
            { name: key.options.key.algorithm, iv: encrypted.iv },
            key.cryptoKey,
            encrypted.data,
        );

        return new Uint8Array(result);
    }

    async toJSON(key: NewLokalAuthKey): Promise<JsonLokalAuthKey> {
        return {
            cryptoKey: await crypto.subtle.exportKey("jwk", key.cryptoKey),
            options: key.options,
        };
    }
}
