import type { UserStoreAdapter } from "./user/store/adapters/user-store-adapter-types.ts";
import type { User } from "./user/user.ts";
import type { EventEncodingAdapter } from "./workspace/adapters/encoding-adapter.types.ts";
import type { EventRepositoryAdapter } from "./workspace/events/adapters/event-adapter.types.ts";
import type { Workspace } from "./workspace/workspace.ts";

export type LokalAuth = {
    login(username: string, password: string): Promise<LokalAuthUser>;
};

export type LokalAuthUser = Omit<
    User,
    "key" | "store" | "workspaceAdapters"
>;
export type LokalAuthWorkspace = Omit<
    Workspace,
    "key" | "encodingService" | "eventRepository"
>;

export type LokalAuthOptions = {
    eventsAdapter: EventRepositoryAdapter;
    userAdapter: UserStoreAdapter;
    eventsEncodingAdapter: EventEncodingAdapter;
};
