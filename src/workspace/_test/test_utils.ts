import { InMemoryAdapter } from "../events/adapters/in-memory-adapter.ts";
import { EventRepository } from "../events/event-repository.ts";
import { Workspace } from "../workspace.ts";
import { UserKey } from "../../user/user-key.ts";
import { WorkspaceKey } from "../workspace-key.ts";
import { User } from "../../user/user.ts";
import { CborAdapter } from "../encoding/adapters/cbor-adapter.ts";
import { EncodingService } from "../encoding/encoding-service.ts";
import { LocalStorageAdapter } from "../../user/store/adapters/local-storage-adapter.ts";

export async function newWorkspace() {
    const encoder = new CborAdapter();
    const encodingService = new EncodingService(encoder);
    const adapter = new InMemoryAdapter();
    const eventRepository = new EventRepository(adapter);
    const userKey = await UserKey.new("test");
    const userId = "some user id";
    const userStore = new LocalStorageAdapter();
    const user = new User(
        { id: userId, username: "some username" },
        userKey,
        userStore,
    );
    const workspaceKey = await WorkspaceKey.new();
    const workspaceId = "some workspace id";
    const workspaceName = "Some Workspace";
    const workspace = new Workspace(
        {
            id: workspaceId,
            name: workspaceName,
            userId,
        },
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
