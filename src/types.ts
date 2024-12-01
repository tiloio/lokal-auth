import type { UserStoreAdapter } from "./user/store/adapters/user-store-adapter.types.ts";
import type { User } from "./user/user.types.ts";
import type { EventEncodingAdapter } from "./workspace/events/encoding/adapters/encoding-adapter.types.ts";
import type { EventStoreAdapter } from "./workspace/events/store/adapters/event-adapter.types.ts";
import type { Workspace } from "./workspace/workspace.type.ts";

export type LokalAuth = {
    login(username: string, password: string): Promise<LokalAuthUser>;
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
