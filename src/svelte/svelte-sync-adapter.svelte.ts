import { LokalAuth } from "../types.ts";
import type { User } from "../user/user.types.ts";
import type { EventData, Event } from "../workspace/events/types.ts";
import type { Workspace } from "../workspace/workspace.type.ts";

/**
 * 
 * Sould work like fetch(), e.g. sync("user/abcedfg")
 * 
 * @param path 
 */
export function sync(path: string, options: SyncOptions): Promise<SyncResult> {

    if(typeof options.workspace === "string") {
        throw new Error("currently not supported!");
    }

    options.lokalAuth.
    
}

export type SyncOptions = {
    lokalAuth: LokalAuth,
    workspace: Workspace | string,
    user: User | string,
    data: EventData
}

export type SyncResult = {
    toJson: () => EventData,
    event: () => Event<EventData> 
}