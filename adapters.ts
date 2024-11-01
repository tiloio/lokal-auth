import { InMemoryEventBusAdapter } from "./src/event-bus/adapters/in-memory.event-bus-adapter.ts";
import { InMemoryUserStoreAdapter } from "./src/user/store/adapters/in-memory-user-store-adapter.ts";
import { LocalStorageAdapter } from "./src/user/store/adapters/local-storage-adapter.ts";
import { CborAdapter } from "./src/workspace/encoding/adapters/cbor-adapter.ts";
import { InMemoryAdapter } from "./src/workspace/events/adapters/in-memory-adapter.ts";

export const EventAdapters = {
    InMemory: InMemoryAdapter,
};

export const EventEncodingAdapters = {
    BinaryCbor: CborAdapter,
};

export const UserAdapters = {
    LocalStorage: LocalStorageAdapter,
    InMemory: InMemoryUserStoreAdapter,
};

export const EventBusAdapters = {
    InMemory: InMemoryEventBusAdapter,
    /**
     * @deprecated not implemented yet
     */
    BroadcastChannel: () => {
        throw new Error("not implemented yet");
    },
};
