import { createIV } from "./key-utils.ts";
import type {
  JsonLocalAuthKey,
  LokalAuthKey,
  Encrypted,
  WorkspaceKeyOptions,
  JsonEncryptedWorkspaceKey,
} from "./types.ts";
import type { UserKey } from "./user-key.ts";
import { encodeBase64, decodeBase64 } from "jsr:@std/encoding";

export class WorkspaceKey implements LokalAuthKey {
  private static ENCRYPTION_ALGORITHM = "AES-GCM" as const;

  private constructor(
    private key: CryptoKey,
    public readonly options: WorkspaceKeyOptions
  ) {}

  static async new() {
    const { key, options } = await this.createKey();
    return new WorkspaceKey(key, options);
  }

  static async fromJSON(userKey: UserKey, jwk: JsonEncryptedWorkspaceKey) {
    const key = await globalThis.crypto.subtle.unwrapKey(
      "jwk",
      decodeBase64(jwk.key),
      userKey.cryptoKey,
      {
        name: "AES-GCM",
        iv: decodeBase64(jwk.iv),
      },
      "AES-GCM",
      true,
      ["encrypt", "decrypt"]
    );

    return new WorkspaceKey(key, jwk.options);
  }

  private static async createKey() {
    const options: WorkspaceKeyOptions = {
      version: "001",
      type: "workspace",
      key: {
        algorithm: "AES-GCM",
        length: 256,
      },
    } as const;

    const key = await globalThis.crypto.subtle.generateKey(
      {
        name: options.key.algorithm,
        length: options.key.length,
      },
      true,
      ["encrypt", "decrypt"]
    );

    return {
      key,
      options: options,
    };
  }

  async encrypt(dataToEncrypt: Uint8Array) {
    const iv = createIV();

    const encryptedData = await globalThis.crypto.subtle.encrypt(
      {
        name: WorkspaceKey.ENCRYPTION_ALGORITHM,
        iv: iv,
      },
      this.key,
      dataToEncrypt
    );

    return { data: new Uint8Array(encryptedData), iv };
  }

  async decrypt(encrypted: Encrypted) {
    const result = await crypto.subtle.decrypt(
      { name: this.options.key.algorithm, iv: encrypted.iv },
      this.key,
      encrypted.data
    );

    return new Uint8Array(result);
  }

  async toJSON(userKey: UserKey): Promise<JsonEncryptedWorkspaceKey> {
    const iv = createIV();
    const wrappedKey = await globalThis.crypto.subtle.wrapKey(
      "jwk",
      this.key,
      userKey.cryptoKey,
      {
        name: WorkspaceKey.ENCRYPTION_ALGORITHM,
        iv,
      }
    );

    return {
      key: encodeBase64(wrappedKey),
      options: this.options,
      iv: encodeBase64(iv),
    };
  }
}
