import type { Workspace } from "../../workspace/workspace.type.ts";
import type { User } from "../user.types.ts";

export type UserEventCallback = (
    data: UserEvent | WorkspaceEvent,
) => void;

export type UserEvent = {
    entity: "user";
    type: "created" | "updated" | "deleted";
    data: User;
};

export type UserEventEntities = "user" | "workspace";
export type UserEventTypes = "created" | "updated" | "deleted";

export type UserEventName = `${UserEventEntities}.${UserEventTypes}`;

export type WorkspaceEvent = {
    entity: "workspace";
    type: "created" | "updated" | "deleted";
    data: Workspace;
};
