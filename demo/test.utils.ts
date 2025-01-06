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
import { WorkspaceKeyCommand } from "../src/workspace/key/workspace-key.command.ts";

export function initLokalAuth(
    eventStoreAdapter: EventStoreAdapter = new EventStoreAdapters.InMemory(),
): NewLokalAuthTestInit {
    const adapter = {
        event: {
            store: eventStoreAdapter,
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
            workspace: new WorkspaceKeyCommand(),
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
        workspace: WorkspaceKeyCommand;
    };
};
