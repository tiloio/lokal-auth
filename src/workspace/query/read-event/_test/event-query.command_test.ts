import { assertEquals } from "@std/assert/equals";
import { assertGreaterOrEqual } from "@std/assert/greater-or-equal";
import { assertLessOrEqual } from "@std/assert/less-or-equal";
import { assertObjectMatch } from "@std/assert/object-match";
import { EventEncodingAdapters } from "../../../../../adapters.ts";
import { WorkspaceCreateCommand } from "../../../command/create/workspace-create.command.ts";
import { EventEncodingService } from "../../../events/encoding/event-encoding-service.ts";
import { InMemoryEventStoreAdapter } from "../../../events/store/adapters/in-memory-event-store-adapter.ts";
import { EventStore } from "../../../events/store/event-store.ts";
import { WorkspaceKeyCommand } from "../../../key/workspace-key.command.ts";
import { ReadEventQuery } from "../read-event.query.ts";
import { EventCreateCommand } from "../../../command/create-event/event-create.command.ts";
import type { EventData } from "../../../events/types.ts";

async function newEventQueryCommand() {
    const adapter = new InMemoryEventStoreAdapter();
    const workspaceKeyCommand = new WorkspaceKeyCommand();
    const encoder = new EventEncodingService(
        new EventEncodingAdapters.BinaryCbor(),
    );
    const command = new ReadEventQuery(
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

    const createEventCommand = new EventCreateCommand(
        new EventStore(adapter),
        encoder,
        workspaceKeyCommand,
    );

    return {
        command,
        adapter,
        workspaceKeyCommand,
        workspace,
        encoder,
        createEventCommand,
    };
}

Deno.test({
    name: "EventQueryCommand: loadEvent loads encrypted event and decrypts it",
    async fn() {
        const startTime = new Date();

        const { workspace, command, createEventCommand } =
            await newEventQueryCommand();

        const expectedEvent = Object.freeze({
            path: "test/test",
            data: Object.freeze({
                hello: "world",
                num: 1,
                bool: false,
                array: Object.freeze([1, 2, 3]),
                object: Object.freeze({
                    a: 1,
                    b: 2,
                    c: 3,
                }),
            }),
        });

        const savedEvent = await createEventCommand.createEvent(
            workspace,
            expectedEvent,
        );
        const event = await command.loadEvent<typeof savedEvent>(
            workspace,
            savedEvent.id,
        );

        assertGreaterOrEqual(event.date.getTime(), startTime.getTime());
        assertLessOrEqual(event.date.getTime(), new Date().getTime());

        assertEquals(event.id, savedEvent.id);
        assertEquals(event.version, savedEvent.version);

        assertEquals(event.device, globalThis.navigator.userAgent);
        assertEquals(event.workspace, workspace.id);
        assertEquals(event.path, expectedEvent.path);
        assertEquals(event.user, workspace.userPrivacyId);

        assertObjectMatch(event.data, expectedEvent.data);
    },
});

Deno.test({
    name: "EventQueryCommand: loadPathEvents loads all event for a path",
    async fn() {
        const { workspace, command, createEventCommand } =
            await newEventQueryCommand();

        const path = "car/1";
        const pathEvents = [{
            path,
            data: { event1: "event1" },
        }, {
            path,
            data: { event2: "event2" },
        }, {
            path,
            data: { event3: "event3" },
        }, {
            path,
            data: { event4: "event4" },
        }];
        interface TestEventData extends EventData {
            event1?: string;
            event2?: string;
            event3?: string;
            event4?: string;
            "not car 1 car/2"?: string;
            "not car 1 car"?: string;
            "not car 1 car/"?: string;
        }

        const newEvents: Array<{ path: string; data: TestEventData }> = [
            {
                path: "car/2",
                data: { "not car 1 car/2": "not car 1 car/2" },
            },
            ...pathEvents,
            {
                path: "car",
                data: { "not car 1 car": "not car 1 car" },
            },
            {
                path: "car/",
                data: { "not car 1 car/": "not car 1 car/" },
            },
        ];

        for (const event of newEvents) {
            await createEventCommand.createEvent(workspace, event);
        }
        const events = await command.loadPathEvents(workspace, path);

        const expectedEvents = pathEvents.map((event) => {
            return { data: event.data, path: event.path };
        });
        const currentEvents = events.map((event) => {
            return { data: event.data, path: event.path };
        });
        assertEquals(currentEvents, expectedEvents);
    },
});
