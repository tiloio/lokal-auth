import type { UserAttributes } from "../user-attributes.ts";
import type { WorkspaceAttributes } from "../../workspace/workspace-attributes.ts";

export type UserEventCallback = (
    data: UserEvent | WorkspaceEvent,
) => void;

export type UserEvent = {
    entity: "user";
    type: "created" | "updated" | "deleted";
    data: UserAttributes;
};

export type UserEventEntities = "user" | "workspace";
export type UserEventTypes = "created" | "updated" | "deleted";

export type UserEventName = `${UserEventEntities}.${UserEventTypes}`;

export type WorkspaceEvent = {
    entity: "workspace";
    type: "created" | "updated" | "deleted";
    data: WorkspaceAttributes;
};
