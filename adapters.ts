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
};
