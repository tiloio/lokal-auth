import type { Encrypted } from "../key/types.ts";

export type UserMessage = {
    id: string;
    salt: Uint8Array;
    encryptedAttributes: Encrypted;
};
