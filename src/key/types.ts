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

export type WorkspaceKeyOptions = {
    type: "workspace";
    version: "001";
    key: {
        algorithm: "AES-GCM";
        length: 256;
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

export interface LokalAuthKey {
    encrypt(data: Uint8Array): Promise<Encrypted>;
    decrypt(data: Encrypted): Promise<Uint8Array>;
}
