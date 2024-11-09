export type KeyTypes = "user" | "workspace";

export type DerivedKeyOptions = {
    version: "001";
    type: "user";
    deriveKeyAlgorithm: "PBKDF2";
    key: {
        iterations: 900_000;
        algorithm: "AES-GCM";
        hash: "SHA-256";
        salt: Uint8Array;
        length: 256;
    };
};

export const WORKSPACE_KEY_OPTIONS_TYPE = "workspace";
export const WORKSPACE_KEY_OPTIONS_VERSION = "001";
export const WORKSPACE_KEY_OPTIONS_ALGORITHM = "AES-GCM";
export const WORKSPACE_KEY_OPTIONS_LENGTH = 256;

export type WorkspaceKeyOptions = {
    type: typeof WORKSPACE_KEY_OPTIONS_TYPE;
    version: typeof WORKSPACE_KEY_OPTIONS_VERSION;
    key: {
        algorithm: typeof WORKSPACE_KEY_OPTIONS_ALGORITHM;
        length: typeof WORKSPACE_KEY_OPTIONS_LENGTH;
    };
};

export type JsonLocalAuthKey = {
    key: JsonWebKey;
    options: DerivedKeyOptions;
};

export type JsonEncryptedWorkspaceKey = {
    key: string;
    iv: string;
    options: WorkspaceKeyOptions;
};

export type Encrypted = {
    data: Uint8Array;
    iv: Uint8Array;
};

export type NewLokalAuthKey = {
    options: LokalAuthKeyOptions;
    cryptoKey: CryptoKey;
};

export type NewJsonLocalAuthKey = Omit<NewLokalAuthKey, "cryptoKey"> & {
    cryptoKey: JsonWebKey;
};

export type LokalAuthSaltedKey = NewLokalAuthKey & {
    salt: Uint8Array;
};

export type Base64Encoded = string;

export type JsonLokalAuthSaltedKey =
    & NewJsonLocalAuthKey
    & Omit<LokalAuthSaltedKey, "salt" | "cryptoKey">
    & {
        salt: Base64Encoded;
        cryptoKey: JsonWebKey;
    };

export type LokalAuthKeyOptions = {
    type: "user" | "workspace";
    version: "001";
    key: {
        algorithm: "AES-GCM";
        length: 256;
    };
};

export interface LokalAuthKey {
    encrypt(data: Uint8Array): Promise<Encrypted>;
    decrypt(data: Encrypted): Promise<Uint8Array>;
}

export interface LokalAuthSaltedKeyService {
    encrypt(key: LokalAuthSaltedKey, data: Uint8Array): Promise<Encrypted>;
    decrypt(key: LokalAuthSaltedKey, data: Encrypted): Promise<Uint8Array>;
    toJSON(key: LokalAuthSaltedKey): Promise<JsonLokalAuthSaltedKey>;
    fromJSON(jsonKey: JsonLokalAuthSaltedKey): Promise<LokalAuthSaltedKey>;
}
