import {
    EventEncodingAdapters,
    EventStoreAdapters,
    UserStoreAdapters,
} from "../../../../adapters.ts";
import type { LokalAuthSaltedKey } from "../../../key/types.ts";
import { EventCreateCommand } from "../../../workspace/command/create-event/event-create.command.ts";
import { WorkspaceCreateCommand } from "../../../workspace/command/create/workspace-create.command.ts";
import { EventEncodingService } from "../../../workspace/events/encoding/event-encoding-service.ts";
import { EventStore } from "../../../workspace/events/store/event-store.ts";
import { WorkspaceKeyCommand } from "../../../workspace/key/workspace-key.command.ts";
import { ReadEventQuery } from "../../../workspace/query/read-event/read-event.query.ts";
import { WorkspaceService } from "../../../workspace/service/service.workspace.ts";
import type { EncryptedUserAttributes } from "../../attributes/attributes.user.types.ts";
import { UserUpsertWorkspaceCommand } from "../../command/upsert-workspace/user-upsert-workspace.command.ts";
import { UserKeyCommand } from "../../key/user-key.command.ts";
import { UserService } from "../service.user.ts";

export function newUserService() {
    const adapter = {
        event: {
            store: new EventStoreAdapters.InMemory(),
            encoding: new EventEncodingAdapters.BinaryCbor(),
        },
        user: {
            store: new UserStoreAdapters.InMemory(),
        },
    };
    const keys = {
        user: new UserKeyCommand(),
        workspace: new WorkspaceKeyCommand(),
    };
    const userService = new UserService(
        adapter.user.store,
        keys.user,
        keys.workspace,
    );

    const workspaceService = new WorkspaceService(
        new UserUpsertWorkspaceCommand(
            adapter.user.store,
            keys.user,
            keys.workspace,
        ),
        new WorkspaceCreateCommand(keys.workspace),
        new EventCreateCommand(
            new EventStore(adapter.event.store),
            new EventEncodingService(adapter.event.encoding),
            keys.workspace,
        ),
        new ReadEventQuery(
            new EventStore(adapter.event.store),
            new EventEncodingService(adapter.event.encoding),
            keys.workspace,
        ),
    );

    return {
        adapter,
        userService,
        workspaceService,
        keys,
    };
}

export async function testEncryptUserAttributes(
    service: UserKeyCommand,
    userKey: LokalAuthSaltedKey,
    attributes: EncryptedUserAttributes,
) {
    return await service.encrypt(
        userKey,
        new TextEncoder().encode(JSON.stringify(attributes)),
    );
}
