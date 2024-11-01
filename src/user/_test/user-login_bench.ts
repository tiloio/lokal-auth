import { CborAdapter } from "../../workspace/encoding/adapters/cbor-adapter.ts";
import { InMemoryAdapter } from "../../workspace/events/adapters/in-memory-adapter.ts";
import { InMemoryUserStoreAdapter } from "../store/adapters/in-memory-user-store-adapter.ts";
import { UserService } from "../user-service.ts";

Deno.bench({
    name: "User Login: first login",
    fn: async (b) => {
        b.start();
        const userService = new UserService(new InMemoryUserStoreAdapter(), {
            encoding: new CborAdapter(),
            repository: new InMemoryAdapter(),
        });
        await userService.login("some username", "some password");
        b.end();
    },
});

Deno.bench({
    name: "User Login: with stored user (second login)",
    fn: async (b) => {
        const userService = new UserService(new InMemoryUserStoreAdapter(), {
            encoding: new CborAdapter(),
            repository: new InMemoryAdapter(),
        });
        await userService.login("some username", "some password");

        b.start();
        await userService.login("some username", "some password");
        b.end();
    },
});
