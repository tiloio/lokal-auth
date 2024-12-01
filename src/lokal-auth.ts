import type { LokalAuth, LokalAuthOptions } from "./types.ts";
import { UserKeyCommand } from "./user/key/user-key.command.ts";
import { UserService } from "./user/service/service.user.ts";
import { WorkspaceKeyCommand } from "./workspace/key/workspace-key.command.ts";

export function initializeLokalAuth(options: LokalAuthOptions): LokalAuth {
    const userService = new UserService(
        options.userStoreAdapter,
        new UserKeyCommand(),
        new WorkspaceKeyCommand(),
    );

    return {
        async login(username, password) {
            return await userService.login(username, password);
        },
    };
}
