// deno-lint-ignore-file no-explicit-any
import { assertObjectMatch } from "@std/assert/object-match";
import { EventEncodingAdapters } from "../../../../../adapters.ts";
import { EventEncodingService } from "../../../events/encoding/event-encoding-service.ts";
import { InMemoryEventStoreAdapter } from "../../../events/store/adapters/in-memory-event-store-adapter.ts";
import { EventStore } from "../../../events/store/event-store.ts";
import { WorkspaceKeyCommand } from "../../../key/workspace-key.command.ts";
import { EventCreateCommand } from "../event-create.command.ts";
import { assertExists } from "@std/assert/exists";
import { assertEquals } from "@std/assert/equals";
import { assertLessOrEqual } from "@std/assert/less-or-equal";
import { assertGreaterOrEqual } from "@std/assert/greater-or-equal";
import { WorkspaceCreateCommand } from "../../create/workspace-create.command.ts";
import { assertInstanceOf } from "@std/assert/instance-of";
import type { DecryptedEventData } from "../../../events/types.ts";

async function newCreateEventCommand() {
    const adapter = new InMemoryEventStoreAdapter();
    const workspaceKeyCommand = new WorkspaceKeyCommand();
    const encoder = new EventEncodingService(
        new EventEncodingAdapters.BinaryCbor(),
    );
    const command = new EventCreateCommand(
        new EventStore(adapter),
        encoder,
        workspaceKeyCommand,
    );

    const createWorkspaceCommand = new WorkspaceCreateCommand(
        workspaceKeyCommand,
    );
    const workspace = await createWorkspaceCommand.createWorkspace({
        name: "test",
        userPrivacyId: "user id",
    });

    return { command, adapter, workspaceKeyCommand, workspace, encoder };
}

Deno.test({
    name: "EventCreateCommand: createEvent returns the event",
    async fn() {
        const startTime = new Date();

        const { command, workspace } = await newCreateEventCommand();

        const data = {
            hello: "world",
            num: 1,
            bool: false,
            array: [1, 2, 3],
            object: {
                a: 1,
                b: 2,
                c: 3,
            },
        };

        const newEvent = {
            path: "test/test",
            data,
        };

        const event = await command.createEvent(workspace, newEvent);

        assertObjectMatch(event, newEvent);

        assertExists(event.id);
        assertEquals(event.version, 0);
        assertGreaterOrEqual(event.date.getTime(), startTime.getTime());
        assertLessOrEqual(event.date.getTime(), new Date().getTime());
        assertEquals(event.device, globalThis.navigator.userAgent);
    },
});

Deno.test({
    name:
        "EventCreateCommand: createEvent saves encrypted event inside the adapter",
    async fn() {
        const startTime = new Date();

        const { command, workspace, adapter, workspaceKeyCommand, encoder } =
            await newCreateEventCommand();

        const data = Object.freeze({
            hello: "world",
            num: 1,
            bool: false,
            array: Object.freeze([1, 2, 3]),
            object: Object.freeze({
                a: 1,
                b: 2,
                c: 3,
            }),
        });

        const newEvent = Object.freeze({
            path: "test/test",
            data,
        });

        await command.createEvent(workspace, newEvent);

        const events = await adapter.allEvents();

        assertEquals(events.length, 1);

        const event = events[0];

        assertExists(event.id);
        assertEquals(event.version, 0);
        assertEquals(event.workspace, workspace.id);
        assertEquals(event.hashedPath, [
            new Uint8Array([
                169,
                74,
                143,
                229,
                204,
                177,
                155,
                166,
                28,
                76,
                8,
                115,
                211,
                145,
                233,
                135,
                152,
                47,
                187,
                211,
            ]),
            new Uint8Array([
                169,
                74,
                143,
                229,
                204,
                177,
                155,
                166,
                28,
                76,
                8,
                115,
                211,
                145,
                233,
                135,
                152,
                47,
                187,
                211,
            ]),
        ]);
        assertInstanceOf(event.event, Uint8Array);
        assertInstanceOf(event.iv, Uint8Array);

        const decryptedEventCbor = await workspaceKeyCommand.decrypt(
            workspace.key,
            {
                iv: event.iv,
                data: event.event,
            },
        );
        const decryptedEvent = encoder.decode(
            decryptedEventCbor,
        ) as any as DecryptedEventData<typeof newEvent.data>;

        assertGreaterOrEqual(decryptedEvent.date, startTime.getTime());
        assertLessOrEqual(decryptedEvent.date, new Date().getTime());
        assertObjectMatch(decryptedEvent, {
            device: globalThis.navigator.userAgent,
            path: newEvent.path,
            data: newEvent.data,
            user: workspace.userPrivacyId,
        });

        assertEquals((event as any).data, undefined);
        assertEquals((event as any).device, undefined);
        assertEquals((event as any).path, undefined);
        assertEquals((event as any).user, undefined);
        assertEquals((event as any).date, undefined);
    },
});
