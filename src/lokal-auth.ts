import type { LokalAuth, LokalAuthOptions } from "./types.ts";
import { UserUpsertWorkspaceCommand } from "./user/command/upsert-workspace/user-upsert-workspace.command.ts";
import { UserKeyCommand } from "./user/key/user-key.command.ts";
import { UserService } from "./user/service/service.user.ts";
import { EventCreateCommand } from "./workspace/command/create-event/event-create.command.ts";
import { WorkspaceCreateCommand } from "./workspace/command/create/workspace-create.command.ts";
import { EventEncodingService } from "./workspace/events/encoding/event-encoding-service.ts";
import { EventStore } from "./workspace/events/store/event-store.ts";
import { WorkspaceKeyCommand } from "./workspace/key/workspace-key.command.ts";
import { ReadEventQuery } from "./workspace/query/read-event/read-event.query.ts";
import { WorkspaceService } from "./workspace/service/service.workspace.ts";

export function initializeLokalAuth(options: LokalAuthOptions): LokalAuth {
    const keyCommands = {
        user: new UserKeyCommand(),
        workspace: new WorkspaceKeyCommand(),
    };
    const userService = new UserService(
        options.userStoreAdapter,
        keyCommands.user,
        keyCommands.workspace,
    );

    const eventStore = new EventStore(options.eventStoreAdapter);
    const eventEncodingService = new EventEncodingService(
        options.eventEncodingAdapter,
    );
    const workspaceService = new WorkspaceService(
        new UserUpsertWorkspaceCommand(
            options.userStoreAdapter,
            keyCommands.user,
            keyCommands.workspace,
        ),
        new WorkspaceCreateCommand(
            keyCommands.workspace,
        ),
        new EventCreateCommand(
            eventStore,
            eventEncodingService,
            keyCommands.workspace,
        ),
        new ReadEventQuery(
            eventStore,
            eventEncodingService,
            keyCommands.workspace,
        ),
    );

    return {
        async login(username, password) {
            return await userService.login(username, password);
        },
        async createWorkspace(user, name) {
            return await workspaceService.newWorkspace(user, name);
        },
        async createEvent(workspace, newEvent) {
            return await workspaceService.createEvent(workspace, newEvent);
        },
        async listEvents(workspace, path) {
            return await workspaceService.listByPath(workspace, path);
        },
    };
}
