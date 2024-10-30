import { decodeBase64, encodeBase64 } from "jsr:@std/encoding/base64";
import type { SaltStoreAdapter } from "./store-adapter-types.ts";

export class LocalStorageSaltAdapter implements SaltStoreAdapter {
    async loadSalt(id: string): Promise<Uint8Array | undefined> {
        const salt = sessionStorage.getItem(buildKey(id));
        if (!salt) {
            return undefined;
        }

        return decodeBase64(salt);
    }

    async saveSalt(id: string, salt: Uint8Array): Promise<void> {
        sessionStorage.setItem(buildKey(id), encodeBase64(salt));
    }
}

function buildKey(id: string) {
    return `lokal-auth-salt-${id}`;
}   