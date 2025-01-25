import type { UserStoreAdapter } from "./user/store/adapters/user-store-adapter.types.ts";
import type { User } from "./user/user.types.ts";
import type { EventEncodingAdapter } from "./workspace/events/encoding/adapters/encoding-adapter.types.ts";
import type { EventStoreAdapter } from "./workspace/events/store/adapters/event-adapter.types.ts";
import type {
    CreateEvent,
    Event,
    EventData,
} from "./workspace/events/types.ts";
import type { Workspace } from "./workspace/workspace.type.ts";

export type LokalAuth = {
    login(username: string, password: string): Promise<LokalAuthUser>;
    createWorkspace(
        user: LokalAuthUser,
        name: string,
    ): Promise<LokalAuthWorkspace>;
    createEvent<T extends EventData>(
        workspace: LokalAuthWorkspace,
        newEvent: CreateEvent<T>,
    ): Promise<Event<T>>;
    listEvents(
        workspace: LokalAuthWorkspace,
        path: string,
    ): Promise<Event<EventData>[]>;
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

export type LokalAuthEvent<Data extends EventData> = Event<Data>;
