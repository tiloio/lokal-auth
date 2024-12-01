import type { UserStoreAdapter } from "./user/store/adapters/user-store-adapter.types.ts";
import type { User } from "./user/user.types.ts";
import type { EventEncodingAdapter } from "./workspace/events/encoding/adapters/encoding-adapter.types.ts";
import type { EventStoreAdapter } from "./workspace/events/store/adapters/event-adapter.types.ts";
import type { CreateEvent, Event } from "./workspace/events/types.ts";
import type { Workspace } from "./workspace/workspace.type.ts";

export type LokalAuth = {
    login(username: string, password: string): Promise<LokalAuthUser>;
    createWorkspace(
        user: LokalAuthUser,
        name: string,
    ): Promise<LokalAuthWorkspace>;
    createEvent<T>(
        workspace: LokalAuthWorkspace,
        newEvent: CreateEvent<T>,
    ): Promise<Event<T>>;
};

export type LokalAuthUser = Omit<
    User,
    "store" | "workspaceAdapters"
>;
export type LokalAuthWorkspace = Omit<
    Workspace,
    "encodingService" | "eventRepository"
>;

export type LokalAuthOptions = {
    eventStoreAdapter: EventStoreAdapter;
    userStoreAdapter: UserStoreAdapter;
    eventEncodingAdapter: EventEncodingAdapter;
};
