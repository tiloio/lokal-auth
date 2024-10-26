import { assertEquals } from "@std/assert/equals";
import { CborAdapter } from "../data/adapters/encoding/cbor-adapter.ts";
import { InMemoryAdapter } from "../data/adapters/events/in-memory-adapter.ts";
import { EncodingService } from "../encoding-service.ts";
import { UserKey } from "../key/user-key.ts";
import { User } from "../user.ts";
import { Workspace } from "../workspace.ts";
import { assertNotEquals } from "@std/assert/not-equals";
import { WorkspaceKey } from "../key/workspace-key.ts";

Deno.test({
    name: "Workspace: Workspace.new() creates a new workspace",
    async fn() {
        const adapters = {
            repository: new InMemoryAdapter(),
            encoding: new CborAdapter(),
        };
        const options = {
            name: "workspace name",
            userId: "user id",
        };

        const workspace = await Workspace.new(options, adapters);

        const event = await workspace.saveEvent({
            path: "test/test",
            data: {
                hello: "world",
            },
        });

        const allEvents = await adapters.repository.allEvents();

        const encodingService = new EncodingService(adapters.encoding);
        assertEquals(allEvents.length, 1);
        const currentEvent = allEvents[0];
        const decryptedEvent = await workspace.workspaceKey.decrypt({
            data: currentEvent.event,
            iv: currentEvent.iv,
        });
        const decodedEvent = encodingService.decode(decryptedEvent);

        assertEquals(
            decodedEvent.data,
            event.data,
        );

        assertNotEquals(currentEvent.workspace, options.name);
        assertEquals(decodedEvent.user, options.userId);
    },
});

Deno.test({
    name: "Workspace: Workspace.fromKey() loads an existing workspace",
    async fn() {
        const adapters = {
            repository: new InMemoryAdapter(),
            encoding: new CborAdapter(),
        };
        const options = {
            key: await WorkspaceKey.new(),
            name: "workspace name",
            userId: "user id",
            id: "workspace id",
        };

        const workspace = Workspace.fromKey(options, adapters);

        const event = await workspace.saveEvent({
            path: "test/test",
            data: {
                hello: "world",
            },
        });

        const allEvents = await adapters.repository.allEvents();

        const encodingService = new EncodingService(adapters.encoding);
        assertEquals(allEvents.length, 1);
        const currentEvent = allEvents[0];
        const decryptedEvent = await options.key.decrypt({
            data: currentEvent.event,
            iv: currentEvent.iv,
        });
        const decodedEvent = encodingService.decode(decryptedEvent);

        assertEquals(
            decodedEvent.data,
            event.data,
        );

        assertEquals(currentEvent.workspace, options.id);
        assertEquals(decodedEvent.user, options.userId);
    },
});
