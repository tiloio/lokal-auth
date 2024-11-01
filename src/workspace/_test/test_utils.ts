import { InMemoryAdapter } from "../events/adapters/in-memory-adapter.ts";
import { EventRepository } from "../events/event-repository.ts";
import { Workspace } from "../workspace.ts";
import { UserKey } from "../../user/user-key.ts";
import { WorkspaceKey } from "../workspace-key.ts";
import { User } from "../../user/user.ts";
import { CborAdapter } from "../encoding/adapters/cbor-adapter.ts";
import { EncodingService } from "../encoding/encoding-service.ts";
import { UserAttributes } from "../../user/user-attributes.ts";
import { WorkspaceAttributes } from "../workspace-attributes.ts";
import { UserEventBus } from "../../user/event-bus/user-event-bus.ts";
import { InMemoryEventBusAdapter } from "../../event-bus/adapters/in-memory.event-bus-adapter.ts";
import { InMemoryUserStoreAdapter } from "../../user/store/adapters/in-memory-user-store-adapter.ts";

export async function newWorkspace() {
    const encoder = new CborAdapter();
    const encodingService = new EncodingService(encoder);
    const adapter = new InMemoryAdapter();
    const eventRepository = new EventRepository(adapter);
    const userKey = await UserKey.new("test");
    const userStore = new InMemoryUserStoreAdapter();
    const user = new User(
        new UserAttributes(
            "some user id",
            "privacy id",
            "some username",
            new Date(),
        ),
        userKey,
        userStore,
        new UserEventBus(new InMemoryEventBusAdapter()),
        {
            encoding: encoder,
            repository: adapter,
        },
    );
    const workspaceKey = await WorkspaceKey.new();
    const workspaceId = "some workspace id";
    const workspaceName = "Some Workspace";
    const workspace = new Workspace(
        new WorkspaceAttributes(
            workspaceId,
            workspaceName,
            user.attributes.privacyId,
            new Date(100),
            new Date(100),
        ),
        workspaceKey,
        eventRepository,
        encodingService,
    );

    return {
        workspace,
        workspaceKey,
        user,
        encoder,
        adapter,
    };
}
