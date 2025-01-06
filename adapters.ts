import { InMemoryEventBusAdapter } from "./src/message-bus/adapters/in-memory.event-bus-adapter.ts";
import { InMemoryUserStoreAdapter } from "./src/user/store/adapters/in-memory-user-store-adapter.ts";
import { LocalStorageAdapter } from "./src/user/store/adapters/local-storage-adapter.ts";
import type { UserStoreAdapter } from "./src/user/store/adapters/user-store-adapter.types.ts";
import type { EventEncodingAdapter } from "./src/workspace/events/encoding/adapters/encoding-adapter.types.ts";
import { CborAdapter } from "./src/workspace/events/encoding/adapters/cbor-adapter.ts";
import type { EventStoreAdapter } from "./src/workspace/events/store/adapters/event-adapter.types.ts";
import { InMemoryEventStoreAdapter } from "./src/workspace/events/store/adapters/in-memory-event-store-adapter.ts";
import { IndexedDbEventStoreAdapter } from "./src/workspace/events/store/adapters/indexeddb-event-store-adapter.ts";

export const EventStoreAdapters: {
    [k: string]: new () => EventStoreAdapter;
} = {
    InMemory: InMemoryEventStoreAdapter,
    IndexedDB: IndexedDbEventStoreAdapter,
};

export const EventEncodingAdapters: {
    [k: string]: new () => EventEncodingAdapter;
} = {
    BinaryCbor: CborAdapter,
};

export const UserStoreAdapters: { [k: string]: new () => UserStoreAdapter } = {
    LocalStorage: LocalStorageAdapter,
    InMemory: InMemoryUserStoreAdapter,
};

export const EventBusAdapters = {
    InMemory: InMemoryEventBusAdapter,
    /**
     * @deprecated not implemented yet
     */
    BroadcastChannel: (): void => {
        throw new Error("not implemented yet");
    },
};
