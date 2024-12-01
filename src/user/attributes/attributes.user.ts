import type { LokalAuthKeyCommand } from "../../key/types.ts";
import {
    CURRENT_WORKSPACE_VERSION,
    type Workspace,
} from "../../workspace/workspace.type.ts";
import { CURRENT_USER_VERSION } from "../user.types.ts";
import type {
    EncryptedUserAttributes,
    UserAttributes,
} from "./attributes.user.types.ts";

export async function UserAttributesFromByteEncodedJSON(
    workspaceKeyCommand: LokalAuthKeyCommand,
    attributesUintArray: Uint8Array,
): Promise<UserAttributes> {
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

    if (attributes._version !== CURRENT_USER_VERSION) {
        throw new Error(
            `Version mismatch in user attributes, got ${attributes._version} but expected ${CURRENT_USER_VERSION}.`,
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

    if (
        !("lastUpdateDate" in attributes) ||
        (typeof attributes.lastUpdateDate !== "number" &&
            typeof attributes.lastUpdateDate !== "bigint")
    ) {
        throw error(attributes, "lastUpdateDate", "number");
    }

    if (
        !("workspaces" in attributes) ||
        typeof attributes.workspaces !== "object" ||
        !Array.isArray(attributes.workspaces)
    ) {
        throw error(attributes, "workspaces", "array");
    }

    return {
        id: attributes.id,
        privacyId: attributes.privacyId,
        username: attributes.username,
        creationDate: new Date(Number(attributes.creationDate)),
        lastUpdateDate: new Date(Number(attributes.lastUpdateDate)),
        workspaces: await extractWorkspaces(
            workspaceKeyCommand,
            attributes.workspaces,
        ),
        _version: CURRENT_USER_VERSION,
    };
}

async function extractWorkspaces(
    workspaceKeyCommand: LokalAuthKeyCommand,
    workspaces: unknown,
): Promise<Workspace[]> {
    if (
        typeof workspaces !== "object" || workspaces === null ||
        !Array.isArray(workspaces)
    ) {
        throw error(workspaces, "attributes.workspaces", "array");
    }

    return await Promise.all(workspaces.map(async (workspace) => {
        if (workspace._version !== CURRENT_WORKSPACE_VERSION) {
            throw new Error(
                `Version mismatch in user attributes.workspace, got ${workspace._version} but expected ${CURRENT_WORKSPACE_VERSION}.`,
            );
        }

        if (!("id" in workspace) || typeof workspace.id !== "string") {
            throw error(workspace, "attribtues.workspace.id", "string");
        }
        if (!("name" in workspace) || typeof workspace.name !== "string") {
            throw error(workspace, "attribtues.workspace.name", "string");
        }
        if (
            !("userPrivacyId" in workspace) ||
            typeof workspace.userPrivacyId !== "string"
        ) {
            throw error(
                workspace,
                "attribtues.workspace.userPrivacyId",
                "string",
            );
        }

        if (
            !("creationDate" in workspace) ||
            (typeof workspace.creationDate !== "number" &&
                typeof workspace.creationDate !== "bigint")
        ) {
            throw error(
                workspace,
                "attributes.workspace.creationDate",
                "number",
            );
        }
        if (
            !("lastUpdateDate" in workspace) ||
            (typeof workspace.lastUpdateDate !== "number" &&
                typeof workspace.lastUpdateDate !== "bigint")
        ) {
            throw error(
                workspace,
                "attributes.workspace.lastUpdateDate",
                "number",
            );
        }
        if (
            !("key" in workspace) ||
            typeof workspace.key !== "object"
        ) {
            throw error(workspace, "attributes.workspace.key", "object");
        }

        return {
            id: workspace.id,
            name: workspace.name,
            userPrivacyId: workspace.userPrivacyId,
            creationDate: new Date(workspace.creationDate),
            lastUpdateDate: new Date(workspace.lastUpdateDate),
            key: await workspaceKeyCommand.fromJSON(workspace.key), // Todo check all key attributes
            _version: workspace._version,
        };
    }));
}

export async function UserAttributesToByteEncodedJson(
    workspaceKeyCommand: LokalAuthKeyCommand,
    attributes: UserAttributes,
): Promise<Uint8Array> {
    const attributesData: EncryptedUserAttributes = {
        id: attributes.id,
        privacyId: attributes.privacyId,
        username: attributes.username,
        creationDate: attributes.creationDate.getTime(),
        lastUpdateDate: attributes.lastUpdateDate.getTime(),
        workspaces: await Promise.all(
            attributes.workspaces.map(async (workspace) => {
                return {
                    id: workspace.id,
                    name: workspace.name,
                    userPrivacyId: workspace.userPrivacyId,
                    creationDate: workspace.creationDate.getTime(),
                    lastUpdateDate: workspace.creationDate.getTime(),
                    key: await workspaceKeyCommand.toJSON(workspace.key),
                    _version: workspace._version,
                };
            }),
        ),
        _version: CURRENT_USER_VERSION,
    };

    return new TextEncoder().encode(JSON.stringify(attributesData));
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
