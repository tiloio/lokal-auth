import type { Encrypted } from "../key/types.ts";
import type { UserKey } from "./user-key.ts";

export const CURRENT_VERESION = 0;

export class UserAttributes {
    constructor(
        public readonly id: string,
        public readonly privacyId: string,
        public readonly username: string,
        public readonly creationDate: Date,
    ) {}

    static async fromEncryptedJSON(
        userKey: UserKey,
        encrypted: Encrypted,
    ): Promise<UserAttributes> {
        const attributesUintArray = await userKey.decrypt(encrypted);
        const attributes = JSON.parse(
            new TextDecoder().decode(attributesUintArray),
        ) as unknown;

        if (typeof attributes !== "object" || attributes === null) {
            throw error(attributes, "attributes", "object");
        }

        if (
            !("_version" in attributes) ||
            typeof attributes._version !== "number"
        ) {
            throw error(attributes, "_version", "number");
        }

        if (attributes._version !== CURRENT_VERESION) {
            throw new Error(
                `Version mismatch in user attributes, got ${attributes._version} but expected ${CURRENT_VERESION}.`,
            );
        }

        if (!("id" in attributes) || typeof attributes.id !== "string") {
            throw error(attributes, "id", "string");
        }

        if (
            !("privacyId" in attributes) ||
            typeof attributes.privacyId !== "string"
        ) {
            throw error(attributes, "privacyId", "string");
        }

        if (
            !("username" in attributes) ||
            typeof attributes.username !== "string"
        ) {
            throw error(attributes, "username", "string");
        }

        if (
            !("creationDate" in attributes) ||
            (typeof attributes.creationDate !== "number" &&
                typeof attributes.creationDate !== "bigint")
        ) {
            throw error(attributes, "creationDate", "number");
        }

        return new UserAttributes(
            attributes.id,
            attributes.privacyId,
            attributes.username,
            new Date(Number(attributes.creationDate)),
        );
    }

    toEncryptedJson(userKey: UserKey): Promise<Encrypted> {
        const attributes: EncryptedUserAttributes = {
            id: this.id,
            privacyId: this.privacyId,
            username: this.username,
            creationDate: this.creationDate.getTime(),
            _version: CURRENT_VERESION,
        };

        return userKey.encrypt(
            new TextEncoder().encode(JSON.stringify(attributes)),
        );
    }
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

type EncryptedUserAttributes = {
    id: string;
    privacyId: string;
    username: string;
    creationDate: number;
    _version: typeof CURRENT_VERESION;
};
