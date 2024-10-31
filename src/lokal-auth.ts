import type { LokalAuth, LokalAuthOptions } from "./types.ts";
import { UserService } from "./user/user-service.ts";
import { CborAdapter } from "./workspace/encoding/adapters/cbor-adapter.ts";
import { InMemoryAdapter } from "./workspace/events/adapters/in-memory-adapter.ts";

export function initializeLokalAuth(options: LokalAuthOptions): LokalAuth {
    const userService = new UserService(
        options.userAdapter,
        {
            encoding: new CborAdapter(),
            repository: new InMemoryAdapter(),
        },
    );

    return {
        async login(username, password) {
            return await userService.login(username, password);
        },
    };
}
