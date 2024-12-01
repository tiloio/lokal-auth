import type { NewLokalAuthKey } from "../key/types.ts";
import type { EventEncodingAdapter } from "./events/encoding/adapters/encoding-adapter.types.ts";
import type { EventStoreAdapter } from "./events/store/adapters/event-adapter.types.ts";

export const CURRENT_WORKSPACE_VERSION = 0;
export type Workspace = {
    id: string;
    name: string;
    userPrivacyId: string;
    creationDate: Date;
    lastUpdateDate: Date;
    key: NewLokalAuthKey;
    _version: typeof CURRENT_WORKSPACE_VERSION;
};

export type EventAdapter = {
    store: EventStoreAdapter;
    encoding: EventEncodingAdapter;
};
