import type { UserStoreAdapter } from "./user/store/adapters/user-store-adapter-types.ts";
import { UserService } from "./user/user-service.ts";
import type { User } from "./user/user.ts";
import type { EventEncodingAdapter } from "./workspace/adapters/encoding-adapter.types.ts";
import { CborAdapter } from "./workspace/encoding/adapters/cbor-adapter.ts";
import type { EventRepositoryAdapter } from "./workspace/events/adapters/event-adapter.types.ts";
import { InMemoryAdapter } from "./workspace/events/adapters/in-memory-adapter.ts";

export function initializeLokalAuth(options: LokalAuthOptions): LokalAuth {
    const userService = new UserService(options.userAdapter, {
        encoding: new CborAdapter(),
        repository: new InMemoryAdapter(),
    });

    return {
        async login(username, password) {
            return await userService.login(username, password);
        },
    };
}

export type LokalAuth = {
    login(username: string, password: string): Promise<User>;
};

export type LokalAuthOptions = {
    eventsAdapter: EventRepositoryAdapter;
    userAdapter: UserStoreAdapter;
    eventsEncodingAdapter: EventEncodingAdapter;
};
