//deno-lint-ignore-file require-await

import { decodeBase64, encodeBase64 } from "jsr:@std/encoding/base64";
import type { StoredUser } from "../../user.types.ts";
import type { UserStoreAdapter } from "./user-store-adapter-types.ts";
import {
    type JsonEncryptedWorkspaceKey,
    WORKSPACE_KEY_OPTIONS_ALGORITHM,
    WORKSPACE_KEY_OPTIONS_LENGTH,
    WORKSPACE_KEY_OPTIONS_TYPE,
    WORKSPACE_KEY_OPTIONS_VERSION,
} from "../../../key/types.ts";

export class LocalStorageAdapter implements UserStoreAdapter {
    async loadUser(userId: string): Promise<StoredUser | undefined> {
        const user = localStorage.getItem(createKey(userId));
        if (!user) {
            return undefined;
        }

        const parsedUser = checkUser(JSON.parse(user));

        return {
            id: parsedUser.id,
            encryptedAttributes: {
                data: decodeBase64(parsedUser.encryptedAttributes.data),
                iv: decodeBase64(parsedUser.encryptedAttributes.iv),
            },
            salt: decodeBase64(parsedUser.salt),
            workspaces: parsedUser.workspaces.map((workspace) => {
                return {
                    id: workspace.id,
                    key: workspace.key,
                    encryptedAttributes: {
                        data: decodeBase64(workspace.encryptedAttributes.data),
                        iv: decodeBase64(workspace.encryptedAttributes.iv),
                    },
                };
            }),
        };
    }

    async saveUser(user: StoredUser): Promise<void> {
        const stringifiedUser = {
            id: user.id,
            encryptedAttributes: {
                data: encodeBase64(user.encryptedAttributes.data),
                iv: encodeBase64(user.encryptedAttributes.iv),
            },
            salt: encodeBase64(user.salt),
            workspaces: user.workspaces.map((workspace) => {
                return {
                    id: workspace.id,
                    key: workspace.key,
                    encryptedAttributes: {
                        data: encodeBase64(workspace.encryptedAttributes.data),
                        iv: encodeBase64(workspace.encryptedAttributes.iv),
                    },
                };
            }),
        } satisfies StringifiedStoreUserAttributes;
        localStorage.setItem(
            createKey(user.id),
            JSON.stringify(stringifiedUser),
        );
    }
}

function createKey(id: string) {
    return `lokal-auth-user-${id}`;
}

type StringifiedStoreUserAttributes = {
    id: string;
    encryptedAttributes: StringifiedEncrypted;
    salt: string;
    workspaces: StringifiedStoreUserWorkspaceAttribute[];
};

type StringifiedStoreUserWorkspaceAttribute = {
    id: string;
    key: JsonEncryptedWorkspaceKey;
    encryptedAttributes: StringifiedEncrypted;
};

type StringifiedEncrypted = {
    data: string;
    iv: string;
};

function checkUser(user: unknown): StringifiedStoreUserAttributes {
    if (typeof user !== "object" || user === null) {
        throw error(user, "user", "object");
    }

    if (!("id" in user) || typeof user.id !== "string") {
        throw error(user, "id", "string");
    }

    if (
        !("encryptedAttributes" in user) ||
        typeof user.encryptedAttributes !== "object"
    ) {
        throw error(user, "encryptedAttributes", "object");
    }

    if (!("salt" in user) || typeof user.salt !== "string") {
        throw error(user, "salt", "string");
    }

    if (!("workspaces" in user) || !Array.isArray(user.workspaces)) {
        throw error(user, "workspaces", "array");
    }

    return {
        id: user.id,
        encryptedAttributes: checkEncrypted(user.encryptedAttributes),
        salt: user.salt,
        workspaces: user.workspaces.map((workspace) =>
            checkWorkspace(workspace)
        ),
    };
}

function checkWorkspace(
    workspace: unknown,
): StringifiedStoreUserWorkspaceAttribute {
    if (typeof workspace !== "object" || workspace === null) {
        throw error(workspace, "workspace", "object");
    }

    if (
        !("id" in workspace) ||
        typeof workspace.id !== "string"
    ) {
        throw error(workspace, "id", "string");
    }

    if (
        !("encryptedAttributes" in workspace) ||
        typeof workspace.encryptedAttributes !== "object"
    ) {
        throw error(workspace, "encryptedAttributes", "object");
    }

    if (
        !("key" in workspace) ||
        typeof workspace.key !== "object" || workspace.key == null
    ) {
        throw error(workspace, "key", "object");
    }

    if (
        !("key" in workspace.key) ||
        typeof workspace.key.key !== "string"
    ) {
        throw error(workspace.key, "key", "string");
    }

    if (
        !("iv" in workspace.key) ||
        typeof workspace.key.iv !== "string"
    ) {
        throw error(workspace.key, "iv", "string");
    }

    if (
        !("options" in workspace.key) ||
        typeof workspace.key.options !== "object" ||
        workspace.key.options == null
    ) {
        throw error(workspace.key, "options", "object");
    }

    if (
        !("type" in workspace.key.options) ||
        typeof workspace.key.options.type !== "string"
    ) {
        throw error(workspace.key.options, "type", "string");
    }

    if (
        !("version" in workspace.key.options) ||
        typeof workspace.key.options.version !== "string"
    ) {
        throw error(workspace.key.options, "version", "string");
    }

    if (
        !("key" in workspace.key.options) ||
        typeof workspace.key.options.key !== "object" ||
        workspace.key.options.key == null
    ) {
        throw error(workspace.key.options, "key", "object");
    }

    if (
        !("algorithm" in workspace.key.options.key) ||
        typeof workspace.key.options.key.algorithm !== "string"
    ) {
        throw error(workspace.key.options.key, "algorithm", "string");
    }

    if (
        !("length" in workspace.key.options.key) ||
        typeof workspace.key.options.key.length !== "number"
    ) {
        throw error(workspace.key.options.key, "length", "number");
    }

    if (workspace.key.options.type !== WORKSPACE_KEY_OPTIONS_TYPE) {
        throw new Error(
            `Only ${WORKSPACE_KEY_OPTIONS_TYPE} keys are supported, but got "${workspace.key.options.type}."`,
        );
    }

    if (workspace.key.options.version !== WORKSPACE_KEY_OPTIONS_VERSION) {
        throw new Error(
            `Only workspace keys with version "${WORKSPACE_KEY_OPTIONS_VERSION}" are support, but got "${workspace.key.options.version}."`,
        );
    }

    if (
        workspace.key.options.key.algorithm !== WORKSPACE_KEY_OPTIONS_ALGORITHM
    ) {
        throw new Error(
            `Only workspace keys with ${WORKSPACE_KEY_OPTIONS_ALGORITHM} algorithm are supported, but got "${workspace.key.options.key.algorithm}."`,
        );
    }

    if (workspace.key.options.key.length !== WORKSPACE_KEY_OPTIONS_LENGTH) {
        throw new Error(
            `Only workspace keys with length ${WORKSPACE_KEY_OPTIONS_LENGTH} are supported, but got "${workspace.key.options.key.length}."`,
        );
    }

    return {
        id: workspace.id,
        key: {
            key: workspace.key.key,
            iv: workspace.key.iv,
            options: {
                type: workspace.key.options.type,
                version: workspace.key.options.version,
                key: {
                    algorithm: workspace.key.options.key.algorithm,
                    length: workspace.key.options.key.length,
                },
            },
        },
        encryptedAttributes: checkEncrypted(workspace.encryptedAttributes),
    };
}

function checkEncrypted(encrypted: unknown): StringifiedEncrypted {
    if (typeof encrypted !== "object" || encrypted === null) {
        throw error(encrypted, "encrypted", "object");
    }

    if (!("data" in encrypted) || typeof encrypted.data !== "string") {
        throw error(encrypted, "data", "string");
    }

    if (!("iv" in encrypted) || typeof encrypted.iv !== "string") {
        throw error(encrypted, "iv", "string");
    }

    return {
        data: encrypted.data,
        iv: encrypted.iv,
    };
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
