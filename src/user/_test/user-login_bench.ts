import { WorkspaceKeyCommand } from "../../workspace/key/workspace-key.command.ts";
import { UserKeyCommand } from "../key/user-key.command.ts";
import { UserService } from "../service/service.user.ts";
import { InMemoryUserStoreAdapter } from "../store/adapters/in-memory-user-store-adapter.ts";

function newUserService() {
    const userService = new UserService(
        new InMemoryUserStoreAdapter(),
        new UserKeyCommand(),
        new WorkspaceKeyCommand(),
    );

    return userService;
}

Deno.bench({
    name: "User Login: first login",
    fn: async (b) => {
        b.start();
        await newUserService().login("some username", "some password");
        b.end();
    },
});

Deno.bench({
    name: "User Login: with stored user (second login)",
    fn: async (b) => {
        const userService = newUserService();
        await userService.login("some username", "some password");

        b.start();
        await userService.login("some username", "some password");
        b.end();
    },
});
