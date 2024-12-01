import {
    EventEncodingAdapters,
    EventStoreAdapters,
    UserStoreAdapters,
} from "../adapters.ts";
import { initializeLokalAuth } from "../src/lokal-auth.ts";
import type { LokalAuth } from "../src/types.ts";
import { UserKeyCommand } from "../src/user/key/user-key.command.ts";
import type { UserStoreAdapter } from "../src/user/store/adapters/user-store-adapter.types.ts";
import type { EventEncodingAdapter } from "../src/workspace/events/encoding/adapters/encoding-adapter.types.ts";
import type { EventStoreAdapter } from "../src/workspace/events/store/adapters/event-adapter.types.ts";

export function initLokalAuth(): NewLokalAuthTestInit {
    const adapter = {
        event: {
            store: new EventStoreAdapters.InMemory(),
            encoding: new EventEncodingAdapters.BinaryCbor(),
        },
        user: {
            store: new UserStoreAdapters.InMemory(),
        },
    };
    const lokalAuth = initializeLokalAuth({
        eventStoreAdapter: adapter.event.store,
        eventEncodingAdapter: adapter.event.encoding,
        userStoreAdapter: adapter.user.store,
    });

    return {
        adapter,
        lokalAuth,
        keyCommands: {
            user: new UserKeyCommand(),
            workspace: new UserKeyCommand(),
        },
    };
}

export type NewLokalAuthTestInit = {
    lokalAuth: LokalAuth;
    adapter: {
        event: {
            store: EventStoreAdapter;
            encoding: EventEncodingAdapter;
        };
        user: {
            store: UserStoreAdapter;
        };
    };
    keyCommands: {
        user: UserKeyCommand;
        workspace: UserKeyCommand;
    };
};
