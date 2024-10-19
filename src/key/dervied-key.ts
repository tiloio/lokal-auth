import { createIV, createSalt } from "./key-utils.ts";
import type { DerivedKeyJson, DerivedKeyOptions } from "./types.ts";

export class DerivedKey {
  private static ENCRYPTION_ALGORITHM = "AES-GCM";

  private constructor(
    private key: CryptoKey,
    public readonly options: DerivedKeyOptions
  ) {}

  static async new(password: string) {
    const { key, options } = await this.createKey(password, createSalt());
    return new DerivedKey(key, options);
  }

  static async fromSaltedPassword(password: string, salt: Uint8Array) {
    const { key, options } = await this.createKey(password, salt);
    return new DerivedKey(key, options);
  }

  static async fromJWK(jwk: DerivedKeyJson) {
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk.key,
      this.ENCRYPTION_ALGORITHM,
      true,
      ["encrypt", "decrypt"]
    );
    return new DerivedKey(key, jwk.options);
  }

  private static async createKey(password: string, salt: Uint8Array) {
    const options: DerivedKeyOptions = {
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
      ["deriveBits", "deriveKey"]
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
        name: DerivedKey.ENCRYPTION_ALGORITHM,
        iv: iv,
      },
      this.key,
      dataToEncrypt
    );

    return { encryptedData: new Uint8Array(encryptedData), iv };
  }

  async decrypt({
    iv,
    encryptedData,
  }: {
    iv: Uint8Array;
    encryptedData: ArrayBuffer;
  }) {
    const result = await crypto.subtle.decrypt(
      { name: this.options.key.algorithm, iv: iv },
      this.key,
      encryptedData
    );

    return new Uint8Array(result);
  }

  async toJWK(): Promise<DerivedKeyJson> {
    return {
      key: await crypto.subtle.exportKey("jwk", this.key),
      options: this.options,
    };
  }

  get salt() {
    return this.options.key.salt;
  }
}
