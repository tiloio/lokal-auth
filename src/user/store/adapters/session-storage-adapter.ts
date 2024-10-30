import { decodeBase64, encodeBase64 } from "jsr:@std/encoding/base64";
import type { StoreUserAttributes } from "../../user.types.ts";
import type { StoreAdapter } from "./store-adapter-types.ts";
import type { WorkspaceAttributes } from "../../../workspace/workspace.ts";

export class SessionStorageAdapter implements StoreAdapter {
    async loadUser(userId: string): Promise<StoreUserAttributes | undefined> {
        const user = sessionStorage.getItem(createKey(userId));
        if (!user) {
            return undefined;
        }

        const parsedUser = checkUser(JSON.parse(user));

        return {
            id: parsedUser.id,
            name: parsedUser.name,
            email: parsedUser.email,
            salt: decodeBase64(parsedUser.salt),
            workspaces: parsedUser.workspaces.map((workspace) => {
                return {
                    attributes: workspace.attributes,
                    encryptedKey: {
                        data: decodeBase64(workspace.encryptedKey.data),
                        iv: decodeBase64(workspace.encryptedKey.iv),
                    },
                };
            }),
        };
    }

    async saveUser(user: StoreUserAttributes): Promise<void> {
        const stringifiedUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            salt: encodeBase64(user.salt),
            workspaces: user.workspaces.map((workspace) => {
                return {
                    attributes: workspace.attributes,
                    encryptedKey: {
                        data: encodeBase64(workspace.encryptedKey.data),
                        iv: encodeBase64(workspace.encryptedKey.iv),
                    },
                };
            }),
        } satisfies StringifiedStoreUserAttributes;
        sessionStorage.setItem(
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
    name: string;
    email: string;
    salt: string;
    workspaces: StringifiedStoreUserWorkspaceAttribute[];
};

type StringifiedStoreUserWorkspaceAttribute = {
    attributes: WorkspaceAttributes;
    encryptedKey: StringifiedEncrypted;
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

    if (!("name" in user) || typeof user.name !== "string") {
        throw error(user, "name", "string");
    }

    if (!("email" in user) || typeof user.email !== "string") {
        throw error(user, "email", "string");
    }

    if (!("salt" in user) || typeof user.salt !== "string") {
        throw error(user, "salt", "string");
    }

    if (!("workspaces" in user) || !Array.isArray(user.workspaces)) {
        throw error(user, "workspaces", "array");
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
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
        !("attributes" in workspace) ||
        typeof workspace.attributes !== "object"
    ) {
        throw error(workspace, "attributes", "object");
    }

    if (
        !("encryptedKey" in workspace) ||
        typeof workspace.encryptedKey !== "object"
    ) {
        throw error(workspace, "encryptedKey", "object");
    }

    return {
        attributes: checkWorkspaceAttributes(workspace.attributes),
        encryptedKey: checkEncrypted(workspace.encryptedKey),
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

function checkWorkspaceAttributes(
    workspaceAttributes: unknown,
): WorkspaceAttributes {
    if (
        typeof workspaceAttributes !== "object" || workspaceAttributes === null
    ) {
        throw error(workspaceAttributes, "attributes", "object");
    }

    if (
        !("id" in workspaceAttributes) ||
        typeof workspaceAttributes.id !== "string"
    ) {
        throw error(workspaceAttributes, "id", "string");
    }

    if (
        !("name" in workspaceAttributes) ||
        typeof workspaceAttributes.name !== "string"
    ) {
        throw error(workspaceAttributes, "name", "string");
    }

    if (
        !("userId" in workspaceAttributes) ||
        typeof workspaceAttributes.userId !== "string"
    ) {
        throw error(workspaceAttributes, "userId", "string");
    }

    return {
        id: workspaceAttributes.id,
        name: workspaceAttributes.name,
        userId: workspaceAttributes.userId,
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
