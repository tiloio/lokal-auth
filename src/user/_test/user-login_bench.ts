import { LocalStorageAdapter } from "../store/adapters/local-storage-adapter.ts";
import { UserService } from "../user-service.ts";

Deno.bench({
    name: "User Login: first login",
    fn: async (b) => {
        localStorage.clear();

        b.start();
        const userService = new UserService(new LocalStorageAdapter());
        await userService.login("some username", "some password");
        b.end();
    },
});

Deno.bench({
    name: "User Login: with stored user (second login)",
    fn: async (b) => {
        localStorage.clear();
        const userService = new UserService(new LocalStorageAdapter());
        await userService.login("some username", "some password");

        b.start();
        await userService.login("some username", "some password");
        b.end();
    },
});
