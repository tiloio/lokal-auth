import type { Encrypted } from "../key/types.ts";
import type { WorkspaceKey } from "./workspace-key.ts";

export const CURRENT_VERESION = 0;

export interface WorkspaceAttributesData {
    readonly id: string;
    readonly name: string;
    readonly userPrivacyId: string;
}

export class WorkspaceAttributes implements WorkspaceAttributesData {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly userPrivacyId: string,
        public readonly creationDate: Date,
    ) {}

    static async fromEncryptedJSON(
        workspaceKey: WorkspaceKey,
        encrypted: Encrypted,
    ): Promise<WorkspaceAttributes> {
        const attributesUintArray = await workspaceKey.decrypt(encrypted);
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
                `Version mismatch in workspace attributes, got ${attributes._version} but expected ${CURRENT_VERESION}.`,
            );
        }

        if (!("id" in attributes) || typeof attributes.id !== "string") {
            throw error(attributes, "id", "string");
        }

        if (
            !("userPrivacyId" in attributes) ||
            typeof attributes.userPrivacyId !== "string"
        ) {
            throw error(attributes, "userPrivacyId", "string");
        }

        if (
            !("name" in attributes) ||
            typeof attributes.name !== "string"
        ) {
            throw error(attributes, "name", "string");
        }

        if (
            !("creationDate" in attributes) ||
            (typeof attributes.creationDate !== "number" &&
                typeof attributes.creationDate !== "bigint")
        ) {
            throw error(attributes, "creationDate", "number");
        }

        return new WorkspaceAttributes(
            attributes.id,
            attributes.name,
            attributes.userPrivacyId,
            new Date(Number(attributes.creationDate)),
        );
    }

    toEncryptedJson(workspaceKey: WorkspaceKey): Promise<Encrypted> {
        const attributes: EncryptedWorkspaceAttributes = {
            id: this.id,
            name: this.name,
            userPrivacyId: this.userPrivacyId,
            creationDate: this.creationDate.getTime(),
            _version: CURRENT_VERESION,
        };

        return workspaceKey.encrypt(
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

type EncryptedWorkspaceAttributes = {
    id: string;
    name: string;
    userPrivacyId: string;
    creationDate: number;
    _version: typeof CURRENT_VERESION;
};
