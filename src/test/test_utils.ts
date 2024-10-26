import { InMemoryAdapter } from "../data/adapters/events/in-memory-adapter.ts";
import { EventRepository } from "../data/event-repository.ts";
import { Workspace } from "../workspace.ts";
import { UserKey } from "../key/user-key.ts";
import { WorkspaceKey } from "../key/workspace-key.ts";
import { User } from "../user.ts";
import { CborAdapter } from "../data/adapters/encoding/cbor-adapter.ts";
import { EncodingService } from "../encoding-service.ts";

export async function newWorkspace() {
    const encoder = new CborAdapter();
    const encodingService = new EncodingService(encoder);
    const adapter = new InMemoryAdapter();
    const eventRepository = new EventRepository(adapter);
    const userKey = await UserKey.new("test");
    const userId = "some user id";
    const user = new User(userId, userKey);
    const workspaceKey = await WorkspaceKey.new();
    const workspaceId = "some workspace id";
    const workspaceName = "Some Workspace";
    const workspace = new Workspace(
        workspaceId,
        workspaceName,
        user,
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
