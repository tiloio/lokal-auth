import type { JsonLokalAuthKey } from "../../key/types.ts";
import type { Workspace } from "../../workspace/workspace.type.ts";
import type { User } from "../user.types.ts";

export type UserAttributes = Omit<User, "key">;
export type WorkspaceAttributes =
    & Omit<Workspace, "key" | "creationDate" | "lastUpdateDate">
    & {
        key: JsonLokalAuthKey;
        creationDate: number;
        lastUpdateDate: number;
    };

export type EncryptedUserAttributes =
    & Omit<UserAttributes, "workspaces" | "creationDate" | "lastUpdateDate">
    & {
        workspaces: WorkspaceAttributes[];
        creationDate: number;
        lastUpdateDate: number;
    };
