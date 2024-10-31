import type { LokalAuth, LokalAuthOptions } from "./types.ts";
import { UserService } from "./user/user-service.ts";

export function initializeLokalAuth(options: LokalAuthOptions): LokalAuth {
    const userService = new UserService(
        options.userAdapter,
        {
            encoding: options.eventsEncodingAdapter,
            repository: options.eventsAdapter,
        },
    );

    return {
        async login(username, password) {
            return await userService.login(username, password);
        },
    };
}
